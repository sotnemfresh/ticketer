import { prisma } from '../lib/prisma.js'
import { parseTicketId } from '../helpers/ticketId.js'
import { parseUserId } from '../helpers/userId.js'
import { statusMap, priorityMap, type CreateTicketBody, type SubmitTicketUpdateBody } from '../types/ticket.js'
import { sanitizeEmailHtml } from './mail/sanitizeHtml.js'

export type ServiceError = {
  status: number
  message: string
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

  return prisma.ticket.findUnique({
    where: { id: result.ticketId },
    include: {
      requester: {
        select: { id: true, name: true, email: true },
      },
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  })
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

  if (body.messageType !== undefined && body.messageType !== 'OUTBOUND' && body.messageType !== 'INTERNAL_NOTE') {
    throw { status: 400, message: 'Invalid message type' } satisfies ServiceError
  }

  const messageBody = body.message?.trim()
  const { subject, status, priority, assigneeId, requesterId } = changes
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

  if (Object.keys(ticketData).length === 0 && !messageBody) {
    throw {
      status: 400,
      message: 'Provide at least one ticket change or a message',
    } satisfies ServiceError
  }

  if (messageBody) {
    ticketData.updatedAt = new Date()
  }

  let updated
  try {
    updated = await prisma.$transaction(async (transaction) => {
      const ticket = await transaction.ticket.update({
        where: { id: result.ticketId },
        data: ticketData,
        include: {
          requester: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      })

      const message = messageBody
        ? await transaction.ticketMessage.create({
          data: {
            ticketId: result.ticketId,
            bodyText: messageBody,
            type: body.messageType ?? 'INTERNAL_NOTE',
            authorId,
          },
        })
        : null
      if (message?.type === 'OUTBOUND') {
        const settings = await transaction.mailboxSettings.findUnique({
          where: { id: 1 },
        })
        if (!settings?.enabled || !settings.mailboxAddress?.trim()) {
          throw new Error('Support mailbox is not configured or enabled')
        }

        const followers = await transaction.ticketFollower.findMany({
          where: { ticketId: ticket.id, type: 'CC' },
          select: { email: true },
        })
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
        const ccEmails = [...new Set(followers.map(({ email }) => normalize(email)))]
          .filter((email) => email && email !== requesterEmail && email !== senderMailbox)

        const escapedText = message.bodyText
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
        const bodyHtml = sanitizeEmailHtml(
          `<div>${escapedText.replace(/\r?\n/g, '<br>')}</div>`,
        )

        await transaction.outboundDelivery.create({
          data: {
            messageId: message.id,
            senderMailbox,
            toEmails: [requesterEmail],
            ccEmails,
            subject: ticket.subject,
            bodyHtml,
            replyToGraphMessageId: anchor?.graphMessageId ?? null,
            inReplyTo: anchor?.messageIdHeader ?? null,
            references: anchor?.references ?? [],
          },
        })
      }
      return { ticket, message }
    })
  } catch (error) {
    console.error('Failed to submit ticket update:', error)
    throw {
      status: 500,
      message: 'Something went wrong while submitting the ticket update',
    } satisfies ServiceError
  }

  return updated
}
