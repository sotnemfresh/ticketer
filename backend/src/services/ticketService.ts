import { prisma } from '../lib/prisma.js'
import { parseTicketId } from '../helpers/ticketId.js'
import { parseUserId } from '../helpers/userId.js'
import { statusMap, priorityMap, type CreateTicketBody, type SubmitTicketUpdateBody, type TicketCcRecipient } from '../types/ticket.js'
import { MAX_HTML_LENGTH, sanitizeEmailHtml } from './mail/sanitizeHtml.js'

export type ServiceError = {
  status: number
  message: string
}

const ccRecipientsRelation = {
  where: { type: 'CC' },
  select: {
    id: true,
    email: true,
    userId: true,
    user: { select: { id: true, name: true, email: true } },
  },
} as const

function toTicketResponse<T extends { followers: TicketCcRecipient[] }>(ticket: T) {
  const { followers, ...ticketFields } = ticket
  return { ...ticketFields, ccRecipients: followers }
}

function parseCcEmails(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 100) {
    throw { status: 400, message: 'CC recipients must be an array of at most 100 email addresses' } satisfies ServiceError
  }

  const emails: string[] = []
  for (const entry of value) {
    if (typeof entry !== 'string') {
      throw { status: 400, message: 'Each CC recipient must be an email address' } satisfies ServiceError
    }
    const email = entry.trim().toLowerCase()
    if (email.length > 254 || /[\x00-\x1f\x7f]/.test(email) || !/^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(email)) {
      throw { status: 400, message: 'Each CC recipient must be a valid email address' } satisfies ServiceError
    }
    emails.push(email)
  }
  return [...new Set(emails)]
}

export async function getAllTickets() {
  return prisma.ticket.findMany({
    include: {
      requester: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  })
}

export async function getTicketById(rawTicketId: string | string[]) {
  const result = await parseTicketId(rawTicketId)

  if ('error' in result) {
    throw {
      status: result.error === 'Ticket not found' ? 404 : 400,
      message: result.error,
    } satisfies ServiceError
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: result.ticketId },
    include: {
      requester: {
        select: { id: true, name: true, email: true },
      },
      assignee: {
        select: { id: true, name: true, email: true },
      },
      followers: ccRecipientsRelation,
    },
  })

  return ticket ? toTicketResponse(ticket) : null
}

export async function createTicket(body: CreateTicketBody, loggedInUserId: number,) {
  const { subject, description, status, priority, requesterId, assigneeId } = body

  if (!subject?.trim()) {
    throw {
      status: 400,
      message: 'subject is required',
    } satisfies ServiceError
  }

  const mappedStatus = status === undefined ? statusMap.NEW : statusMap[status]
  const mappedPriority = priority === undefined ? priorityMap.MEDIUM : priorityMap[priority]

  if (!mappedStatus || !mappedPriority) {
    throw {
      status: 400,
      message: 'Invalid status or priority value',
    } satisfies ServiceError
  }

  const requesterResult = await parseUserId(requesterId ?? loggedInUserId)

  if ('error' in requesterResult) {
    throw {
      status: requesterResult.error === 'User not found' ? 404 : 400,
      message: requesterResult.error,
    } satisfies ServiceError
  }

  if (assigneeId !== undefined && assigneeId !== null) {
    const assigneeResult = await parseUserId(assigneeId)
    if ('error' in assigneeResult) {
      throw {
        status: assigneeResult.error === 'User not found' ? 404 : 400,
        message: assigneeResult.error,
      } satisfies ServiceError
    }
  }

  try {
    const data = {
      subject: subject.trim(),
      ...(description?.trim() ? { description: description.trim() } : {}),
      status: mappedStatus,
      priority: mappedPriority,
      requester: {
        connect: { id: requesterResult.userId },
      },
      ...(assigneeId !== undefined && assigneeId !== null
        ? { assignee: { connect: { id: assigneeId } } }
        : {}),
    }

    return await prisma.ticket.create({
      data,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    })
  } catch {
    throw {
      status: 500,
      message: 'Something went wrong while creating the ticket',
    } satisfies ServiceError
  }
}

export async function getTicketMessages(rawTicketId: string | string[]) {
  const result = await parseTicketId(rawTicketId)

  if ('error' in result) {
    throw {
      status: result.error === 'Ticket not found' ? 404 : 400,
      message: result.error,
    } satisfies ServiceError
  }

  return prisma.ticketMessage.findMany({
    where: { ticketId: result.ticketId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, email: true } },
      outboundDelivery: {
        select: {
          id: true,
          status: true,
          attemptCount: true,
          needsInvestigation: true,
          lastError: true,
          nextReconcileAt: true,
          acceptedAt: true,
          metadataVerifiedAt: true,
        },
      },
      attachments: {
        select: { id: true, filename: true, mimeType: true, size: true, isInline: true, contentId: true, purgedAt: true },
      },
    },
  })
}

export async function submitTicketUpdate(
  rawTicketId: string | string[],
  body: SubmitTicketUpdateBody,
  authorId: number,
) {
  const result = await parseTicketId(rawTicketId)

  if ('error' in result) {
    throw {
      status: result.error === 'Ticket not found' ? 404 : 400,
      message: result.error,
    } satisfies ServiceError
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw {
      status: 400,
      message: 'Invalid ticket update body',
    } satisfies ServiceError
  }

  const changes = body.changes ?? {}
  if (typeof changes !== 'object' || Array.isArray(changes)) {
    throw { status: 400, message: 'Invalid ticket changes' } satisfies ServiceError
  }

  if (body.message !== undefined && typeof body.message !== 'string') {
    throw { status: 400, message: 'Message must be a string' } satisfies ServiceError
  }

  if (body.messageHtml !== undefined) {
    if (typeof body.messageHtml !== 'string') {
      throw { status: 400, message: 'Message HTML must be a string' } satisfies ServiceError
    }
    if (body.messageHtml.length > MAX_HTML_LENGTH) {
      throw { status: 400, message: `Message HTML must not exceed ${MAX_HTML_LENGTH} characters` } satisfies ServiceError
    }
  }

  if (body.messageType !== undefined && body.messageType !== 'OUTBOUND' && body.messageType !== 'INTERNAL_NOTE') {
    throw { status: 400, message: 'Invalid message type' } satisfies ServiceError
  }

  const messageBody = body.message?.trim()
  let messageHtml: string | null = null
  if (messageBody) {
    const escapedText = messageBody
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
    const fallbackHtml = `<div>${escapedText.replace(/\r?\n/g, '<br>')}</div>`
    const sanitizedHtml = sanitizeEmailHtml(body.messageHtml?.trim() || fallbackHtml)
    messageHtml = sanitizedHtml.trim() ? sanitizedHtml : sanitizeEmailHtml(fallbackHtml)
  }
  const { subject, status, priority, assigneeId, requesterId } = changes
  const requestedCcEmails = changes.ccEmails === undefined ? undefined : parseCcEmails(changes.ccEmails)
  const ticketData: Record<string, unknown> = {}

  if (subject !== undefined) {
    if (typeof subject !== 'string' || subject.trim().length === 0) {
      throw { status: 400, message: 'Subject cannot be empty' } satisfies ServiceError
    }
    ticketData.subject = subject.trim()
  }

  if (status !== undefined) {
    const mappedStatus = statusMap[status]
    if (!mappedStatus) {
      throw { status: 400, message: 'Invalid status value' } satisfies ServiceError
    }
    ticketData.status = mappedStatus
    ticketData.closedAt = mappedStatus === 'CLOSED' ? new Date() : null
  }

  if (priority !== undefined) {
    const mappedPriority = priorityMap[priority]
    if (!mappedPriority) {
      throw { status: 400, message: 'Invalid priority value' } satisfies ServiceError
    }
    ticketData.priority = mappedPriority
  }

  if (requesterId !== undefined) {
    const requesterResult = await parseUserId(requesterId)
    if ('error' in requesterResult) {
      throw {
        status: requesterResult.error === 'User not found' ? 404 : 400,
        message: requesterResult.error,
      } satisfies ServiceError
    }
    ticketData.requester = { connect: { id: requesterId } }
  }

  if (assigneeId !== undefined) {
    if (assigneeId === null) {
      ticketData.assignee = { disconnect: true }
    } else {
      const assigneeResult = await parseUserId(assigneeId)
      if ('error' in assigneeResult) {
        throw {
          status: assigneeResult.error === 'User not found' ? 404 : 400,
          message: assigneeResult.error,
        } satisfies ServiceError
      }
      ticketData.assignee = { connect: { id: assigneeId } }
    }
  }

  if (Object.keys(ticketData).length === 0 && !messageBody && requestedCcEmails === undefined) {
    throw {
      status: 400,
      message: 'Provide at least one ticket change or a message',
    } satisfies ServiceError
  }

  if (messageBody || requestedCcEmails !== undefined) {
    ticketData.updatedAt = new Date()
  }

  let updated
  try {
    updated = await prisma.$transaction(async (transaction) => {
      if (requestedCcEmails !== undefined) {
        const author = await transaction.user.findUnique({
          where: { id: authorId },
          select: { role: true },
        })
        if (!author || (author.role !== 'ADMIN' && author.role !== 'AGENT')) {
          throw { status: 403, message: 'Only agents and administrators may edit CC recipients' } satisfies ServiceError
        }
      }

      let ticket = await transaction.ticket.update({
        where: { id: result.ticketId },
        data: ticketData,
        include: {
          requester: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          followers: ccRecipientsRelation,
        },
      })

      const settings = requestedCcEmails !== undefined || body.messageType === 'OUTBOUND'
        ? await transaction.mailboxSettings.findUnique({ where: { id: 1 } })
        : null
      if (requestedCcEmails !== undefined) {
        const requesterEmail = ticket.requester.email.trim().toLowerCase()
        const senderMailbox = settings?.mailboxAddress?.trim().toLowerCase()
        const finalCcEmails = requestedCcEmails.filter((email) => email !== requesterEmail && email !== senderMailbox)

        await transaction.ticketFollower.deleteMany({
          where: { ticketId: ticket.id, type: 'CC' },
        })
        for (const email of finalCcEmails) {
          const user = await transaction.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            select: { id: true },
            orderBy: { id: 'asc' },
          })
          await transaction.ticketFollower.upsert({
            where: { ticketId_email_type: { ticketId: ticket.id, email, type: 'CC' } },
            create: { ticketId: ticket.id, email, type: 'CC', userId: user?.id ?? null },
            update: { userId: user?.id ?? null },
          })
        }
        ticket = await transaction.ticket.findUniqueOrThrow({
          where: { id: ticket.id },
          include: {
            requester: { select: { id: true, name: true, email: true } },
            assignee: { select: { id: true, name: true, email: true } },
            followers: ccRecipientsRelation,
          },
        })
      }

      const message = messageBody
        ? await transaction.ticketMessage.create({
          data: {
            ticketId: result.ticketId,
            bodyText: messageBody,
            bodyHtml: messageHtml,
            type: body.messageType ?? 'INTERNAL_NOTE',
            authorId,
          },
        })
        : null
      if (message?.type === 'OUTBOUND') {
        if (!settings?.enabled || !settings.mailboxAddress?.trim()) {
          throw new Error('Support mailbox is not configured or enabled')
        }

        const anchor = await transaction.ticketMessage.findFirst({
          where: {
            ticketId: ticket.id,
            type: 'INBOUND',
            graphMessageId: { not: null },
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: {
            graphMessageId: true,
            messageIdHeader: true,
            references: true,
          },
        })

        const normalize = (email: string) => email.trim().toLowerCase()
        const senderMailbox = normalize(settings.mailboxAddress)
        const requesterEmail = normalize(ticket.requester.email)
        const ccEmails = [...new Set(ticket.followers.map(({ email }) => normalize(email)))]
          .filter((email) => email && email !== requesterEmail && email !== senderMailbox)

        await transaction.outboundDelivery.create({
          data: {
            messageId: message.id,
            senderMailbox,
            toEmails: [requesterEmail],
            ccEmails,
            subject: ticket.subject,
            bodyHtml: message.bodyHtml!,
            replyToGraphMessageId: anchor?.graphMessageId ?? null,
            inReplyTo: anchor?.messageIdHeader ?? null,
            references: anchor?.references ?? [],
          },
        })
      }
      return { ticket: toTicketResponse(ticket), message }
    })
  } catch (error) {
    if (error !== null && typeof error === 'object' && 'status' in error && 'message' in error &&
        typeof error.status === 'number' && typeof error.message === 'string') {
      throw error
    }
    console.error('Failed to submit ticket update:', error)
    throw {
      status: 500,
      message: 'Something went wrong while submitting the ticket update',
    } satisfies ServiceError
  }

  return updated
}
