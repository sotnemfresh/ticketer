import { prisma } from '../lib/prisma.js'
import { parseTicketId } from '../helpers/ticketId.js'
import { parseUserId } from '../helpers/userId.js'
import { statusMap, priorityMap, type CreateTicketBody, type SubmitTicketUpdateBody } from '../types/ticket.js'

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
  const { subject, description, status, priority } = body

  if (!subject || !description || !status || !priority) {
    throw {
      status: 400,
      message: 'subject, description, status, and priority are required',
    } satisfies ServiceError
  }

  const mappedStatus = statusMap[status]
  const mappedPriority = priorityMap[priority]

  if (!mappedStatus || !mappedPriority) {
    throw {
      status: 400,
      message: 'Invalid status or priority value',
    } satisfies ServiceError
  }

  const userResult = await parseUserId(loggedInUserId)

  if ('error' in userResult) {
    throw {
      status: userResult.error === 'User not found' ? 404 : 400,
      message: userResult.error,
    } satisfies ServiceError
  }

  try {
    const data = {
      subject,
      description,
      status: mappedStatus,
      priority: mappedPriority,
      requester: {
        connect: { id: loggedInUserId },
      },
    }

    return await prisma.ticket.create({
      data,
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

  try {
    return await prisma.$transaction(async (transaction) => {
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
              body: messageBody,
              authorId,
            },
          })
        : null

      return { ticket, message }
    })
  } catch (error) {
    console.error('Failed to submit ticket update:', error)
    throw {
      status: 500,
      message: 'Something went wrong while submitting the ticket update',
    } satisfies ServiceError
  }
}
