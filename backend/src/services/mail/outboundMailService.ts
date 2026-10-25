// builds To/CC and follower notifications

import { randomUUID } from 'node:crypto'
import { prisma } from '../../lib/prisma.js'
import { GraphHttpError } from './graphClient.js'
import {
  createNewDraft,
  createReplyDraft,
  getDeliveryMessage,
  getSentItemsFolderId,
  sendDraft,
  updateDraft,
} from './mailGraphService.js'

const LEASE_MS = 5 * 60_000
const RECONCILE_DELAY_MS = 60_000
const MAX_RECONCILE_CHECKS = 8

function errorMessage(error: unknown) {
  return (error instanceof Error ? error.message : String(error)).slice(0, 1000)
}

function isDefiniteSendRejection(error: unknown) {
  if (!(error instanceof GraphHttpError)) return false
  if ([401, 403, 405, 413, 415, 422, 429].includes(error.status)) return true
  return error.status === 400 && [
    'ErrorInvalidRecipients',
    'ErrorInvalidProperty',
    'ErrorInvalidPropertySet',
    'ErrorInvalidArgument',
    'ErrorRequiredPropertyMissing',
  ].includes(error.code ?? '')
}

function nextReconcile(reconcileCount: number) {
  const delay = Math.min(RECONCILE_DELAY_MS * 2 ** Math.min(reconcileCount, 6), 3_600_000)
  return new Date(Date.now() + delay)
}

export async function requestDeliveryRetry(
  rawTicketId: string | string[],
  rawMessageId: string | string[],
  authorId: number,
  body: unknown,
) {
  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { role: true },
  })
  if (!author || (author.role !== 'AGENT' && author.role !== 'ADMIN')) {
    throw { status: 403, message: 'Only agents and administrators can retry outbound emails' }
  }

  const ticketId = typeof rawTicketId === 'string' ? Number(rawTicketId) : NaN
  const messageId = typeof rawMessageId === 'string' ? Number(rawMessageId) : NaN
  if (!Number.isSafeInteger(ticketId) || ticketId <= 0 || !Number.isSafeInteger(messageId) || messageId <= 0) {
    throw { status: 400, message: 'Invalid ticket or message ID' }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw { status: 400, message: 'Invalid retry request' }
  }
  const { expectedAttemptCount, confirmDuplicateRisk } = body as {
    expectedAttemptCount?: unknown
    confirmDuplicateRisk?: unknown
  }
  if (typeof expectedAttemptCount !== 'number' || !Number.isSafeInteger(expectedAttemptCount) || expectedAttemptCount < 0) {
    throw { status: 400, message: 'A valid expectedAttemptCount is required' }
  }
  if (confirmDuplicateRisk !== undefined && typeof confirmDuplicateRisk !== 'boolean') {
    throw { status: 400, message: 'confirmDuplicateRisk must be a boolean' }
  }

  return prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT "id" FROM "Ticket" WHERE "id" = ${ticketId} FOR UPDATE`
    const ticket = await transaction.ticket.findUnique({
      where: { id: ticketId },
      select: { status: true },
    })
    if (!ticket) throw { status: 404, message: 'Ticket not found' }
    if (ticket.status === 'CLOSED') throw { status: 409, message: 'Closed tickets cannot send emails' }

    const job = await transaction.outboundDelivery.findFirst({
      where: { messageId, message: { ticketId, type: 'OUTBOUND' } },
    })
    if (!job) throw { status: 404, message: 'Outbound delivery not found for this ticket message' }
    if (job.status !== 'FAILED' && job.status !== 'UNKNOWN') {
      throw { status: 409, message: 'Only failed or uncertain deliveries can be retried' }
    }
    if (job.attemptCount !== expectedAttemptCount) {
      throw { status: 409, message: 'The delivery has changed; refresh its status before retrying' }
    }
    const now = new Date()
    if (job.leaseExpiresAt && job.leaseExpiresAt > now) {
      throw { status: 409, message: 'The delivery is being processed; wait for its status to update' }
    }
    if (job.status === 'UNKNOWN') {
      if (confirmDuplicateRisk !== true) {
        throw { status: 409, message: 'This email may already have been sent. Set confirmDuplicateRisk to true to authorize a potentially duplicate send.' }
      }
      if (!job.graphDraftId) {
        throw { status: 409, message: 'The uncertain delivery has no saved draft ID and requires investigation' }
      }
    }

    const settings = await transaction.mailboxSettings.findUnique({ where: { id: 1 } })
    if (!settings?.enabled || !settings.mailboxAddress?.trim()) {
      throw { status: 409, message: 'Support mailbox is not configured or enabled' }
    }

    const otherDelivery = await transaction.outboundDelivery.findFirst({
      where: {
        id: { not: job.id },
        message: { ticketId, type: 'OUTBOUND' },
        status: { in: ['PENDING', 'PREPARING', 'READY', 'SENDING', 'UNKNOWN'] },
      },
      select: { id: true },
    })
    if (otherDelivery) {
      throw { status: 409, message: 'Another email on this ticket has an unresolved send status' }
    }

    const queued = await transaction.outboundDelivery.updateMany({
      where: {
        id: job.id,
        status: job.status,
        attemptCount: expectedAttemptCount,
        updatedAt: job.updatedAt,
        OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lte: now } }],
      },
      data: {
        status: 'PENDING',
        nextAttemptAt: now,
        nextReconcileAt: null,
        reconcileCount: 0,
        needsInvestigation: false,
        metadataVerifiedAt: null,
        lastError: null,
        leaseToken: null,
        leaseExpiresAt: null,
      },
    })
    if (queued.count === 0) {
      throw { status: 409, message: 'The delivery has changed; refresh its status before retrying' }
    }

    return transaction.outboundDelivery.findUniqueOrThrow({
      where: { id: job.id },
      select: { id: true, messageId: true, status: true, attemptCount: true, needsInvestigation: true },
    })
  })
}

export async function prepareDelivery(deliveryId: number) {
  const now = new Date()
  const leaseToken = randomUUID()
  const claim = await prisma.outboundDelivery.updateMany({
    where: {
      id: deliveryId,
      message: { type: 'OUTBOUND' },
      status: 'PENDING',
      nextAttemptAt: { lte: now },
    },
    data: {
      status: 'PREPARING',
      leaseToken,
      leaseExpiresAt: new Date(now.getTime() + LEASE_MS),
      attemptCount: { increment: 1 },
      lastAttemptAt: now,
    },
  })
  if (claim.count === 0) return null

  const owned = { id: deliveryId, status: 'PREPARING' as const, leaseToken }
  const job = await prisma.outboundDelivery.findUniqueOrThrow({ where: { id: deliveryId } })

  try {
    let draftId = job.graphDraftId
    if (!draftId) {
      const draft = job.replyToGraphMessageId
        ? await createReplyDraft(job.senderMailbox, job.replyToGraphMessageId)
        : await createNewDraft(job.senderMailbox, {
            subject: job.subject,
            html: job.bodyHtml,
            to: job.toEmails,
            cc: job.ccEmails,
          })

      const saved = await prisma.outboundDelivery.updateMany({
        where: { ...owned, leaseExpiresAt: { gt: new Date() } },
        data: { graphDraftId: draft.id },
      })
      if (saved.count === 0) throw new Error('Delivery preparation lease was lost')
      draftId = draft.id
    }

    const state = await getDeliveryMessage(job.senderMailbox, draftId)
    if (!state.isDraft) {
      await prisma.outboundDelivery.updateMany({
        where: owned,
        data: {
          status: 'UNKNOWN',
          nextReconcileAt: nextReconcile(0),
          reconcileCount: 0,
          needsInvestigation: false,
          lastError: 'Saved message is no longer a draft; reconciliation is required',
          leaseToken: null,
          leaseExpiresAt: null,
        },
      })
      return null
    }

    const renewed = await prisma.outboundDelivery.updateMany({
      where: { ...owned, leaseExpiresAt: { gt: new Date() } },
      data: { leaseExpiresAt: new Date(Date.now() + LEASE_MS) },
    })
    if (renewed.count === 0) throw new Error('Delivery preparation lease was lost')

    await updateDraft(job.senderMailbox, draftId, {
      html: job.bodyHtml,
      to: job.toEmails,
      cc: job.ccEmails,
    })
    const prepared = await getDeliveryMessage(job.senderMailbox, draftId)
    if (!prepared.isDraft) throw new Error('Prepared message is no longer a draft')

    await prisma.$transaction(async (transaction) => {
      const ready = await transaction.outboundDelivery.updateMany({
        where: { ...owned, leaseExpiresAt: { gt: new Date() } },
        data: {
          status: 'READY',
          internetMessageId: prepared.internetMessageId,
          lastError: null,
          leaseToken: null,
          leaseExpiresAt: null,
        },
      })
      if (ready.count === 0) throw new Error('Delivery preparation lease was lost')

      await transaction.ticketMessage.update({
        where: { id: job.messageId },
        data: {
          bodyHtml: job.bodyHtml,
          messageIdHeader: prepared.internetMessageId,
          inReplyTo: job.inReplyTo,
          references: job.references,
        },
      })
    })
  } catch (error) {
    await prisma.outboundDelivery.updateMany({
      where: owned,
      data: {
        status: 'FAILED',
        lastError: errorMessage(error),
        leaseToken: null,
        leaseExpiresAt: null,
      },
    })
    throw error
  }

  return prisma.outboundDelivery.findUniqueOrThrow({ where: { id: deliveryId } })
}

export async function sendPreparedDelivery(deliveryId: number) {
  const now = new Date()
  const leaseToken = randomUUID()
  const claim = await prisma.outboundDelivery.updateMany({
    where: {
      id: deliveryId,
      status: 'READY',
      graphDraftId: { not: null },
      message: { type: 'OUTBOUND' },
    },
    data: {
      status: 'SENDING',
      sendStartedAt: now,
      lastAttemptAt: now,
      leaseToken,
      leaseExpiresAt: new Date(now.getTime() + LEASE_MS),
    },
  })
  if (claim.count === 0) return null

  const owned = { id: deliveryId, status: 'SENDING' as const, leaseToken }
  const job = await prisma.outboundDelivery.findUniqueOrThrow({ where: { id: deliveryId } })
  if (!job.graphDraftId) throw new Error('Prepared delivery has no draft ID')

  try {
    await sendDraft(job.senderMailbox, job.graphDraftId)
  } catch (error) {
    const rejected = isDefiniteSendRejection(error)
    await prisma.outboundDelivery.updateMany({
      where: owned,
      data: {
        status: rejected ? 'FAILED' : 'UNKNOWN',
        nextReconcileAt: rejected ? null : nextReconcile(0),
        reconcileCount: 0,
        needsInvestigation: false,
        lastError: errorMessage(error),
        leaseToken: null,
        leaseExpiresAt: null,
      },
    })
    throw error
  }

  const accepted = await prisma.outboundDelivery.updateMany({
    where: owned,
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      metadataVerifiedAt: null,
      nextReconcileAt: new Date(),
      reconcileCount: 0,
      needsInvestigation: false,
      lastError: null,
      leaseToken: null,
      leaseExpiresAt: null,
    },
  })
  if (accepted.count === 0) throw new Error('Send accepted by Graph but delivery state requires reconciliation')

  return prisma.outboundDelivery.findUniqueOrThrow({ where: { id: deliveryId } })
}

export async function reconcileDelivery(deliveryId: number) {
  const now = new Date()
  const leaseToken = randomUUID()
  const claim = await prisma.outboundDelivery.updateMany({
    where: {
      id: deliveryId,
      OR: [
        { status: 'UNKNOWN' },
        { status: 'ACCEPTED', metadataVerifiedAt: null },
      ],
      needsInvestigation: false,
      message: { type: 'OUTBOUND' },
      AND: [
        { OR: [{ nextReconcileAt: null }, { nextReconcileAt: { lte: now } }] },
        { OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lte: now } }] },
      ],
    },
    data: {
      leaseToken,
      leaseExpiresAt: new Date(now.getTime() + LEASE_MS),
      reconcileCount: { increment: 1 },
    },
  })
  if (claim.count === 0) return null

  const job = await prisma.outboundDelivery.findUniqueOrThrow({ where: { id: deliveryId } })
  const owned = { id: deliveryId, status: job.status, leaseToken }

  async function unresolved(reason: string, investigate = false) {
    const needsInvestigation = investigate || job.reconcileCount >= MAX_RECONCILE_CHECKS
    await prisma.outboundDelivery.updateMany({
      where: { ...owned, leaseExpiresAt: { gt: new Date() } },
      data: {
        lastError: reason.slice(0, 1000),
        needsInvestigation,
        nextReconcileAt: needsInvestigation ? null : nextReconcile(job.reconcileCount),
        leaseToken: null,
        leaseExpiresAt: null,
      },
    })
  }

  if (!job.graphDraftId) {
    await unresolved('No saved Graph message ID; manual investigation required', true)
    return null
  }
  if (job.reconcileCount > MAX_RECONCILE_CHECKS) {
    await unresolved('Reconciliation check limit reached; manual investigation required', true)
    return null
  }

  try {
    const sent = await getDeliveryMessage(job.senderMailbox, job.graphDraftId)
    const sentItemsId = await getSentItemsFolderId(job.senderMailbox)
    const sentTimestamp = sent.sentDateTime ? Date.parse(sent.sentDateTime) : NaN
    if (sent.isDraft || sent.parentFolderId !== sentItemsId || !Number.isFinite(sentTimestamp) || sentTimestamp <= 0) {
      await unresolved(job.status === 'ACCEPTED'
        ? 'Send accepted; final sent-message metadata is not yet available'
        : sent.isDraft
          ? 'Saved message is still a draft; send outcome remains unknown'
          : 'Saved message does not confirm a send in Sent Items; send outcome remains unknown')
      return null
    }
    if (job.status === 'ACCEPTED' && !sent.internetMessageId) {
      await unresolved('Send accepted; final Internet Message-ID is not yet available')
      return null
    }

    await prisma.$transaction(async (transaction) => {
      const accepted = await transaction.outboundDelivery.updateMany({
        where: { ...owned, leaseExpiresAt: { gt: new Date() } },
        data: {
          status: 'ACCEPTED',
          acceptedAt: job.acceptedAt ?? new Date(),
          graphDraftId: sent.id,
          ...(sent.internetMessageId ? {
            internetMessageId: sent.internetMessageId,
            metadataVerifiedAt: new Date(),
          } : {}),
          lastError: sent.internetMessageId ? null : 'Send confirmed; final Internet Message-ID is not yet available',
          needsInvestigation: false,
          nextReconcileAt: sent.internetMessageId ? null : nextReconcile(0),
          reconcileCount: sent.internetMessageId ? job.reconcileCount : 0,
          leaseToken: null,
          leaseExpiresAt: null,
        },
      })
      if (accepted.count === 0) throw new Error('Delivery reconciliation lease was lost')

      await transaction.ticketMessage.update({
        where: { id: job.messageId },
        data: {
          graphMessageId: sent.id,
          ...(sent.internetMessageId ? { messageIdHeader: sent.internetMessageId } : {}),
        },
      })
    })
  } catch (error) {
    await unresolved(`Reconciliation inconclusive: ${errorMessage(error)}`)
  }

  return prisma.outboundDelivery.findUniqueOrThrow({ where: { id: deliveryId } })
}