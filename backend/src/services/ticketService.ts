import { prisma } from '../lib/prisma.js'
import { parseTicketId } from '../helpers/ticketId.js'
import { parseUserId } from '../helpers/userId.js'
import { statusMap, priorityMap, type CreateTicketBody, type UpdateTicketBody } from '../types/ticket.js'

export type ServiceError = {
  status: number
  message: string
}

export async function getAllTickets() {
  return prisma.ticket.findMany()
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

export async function updateTicket(rawTicketId: string | string[], body: UpdateTicketBody) {
  /* Validate and parse the ticket ID */
  const ticketResult = await parseTicketId(rawTicketId)
/* Check if ticket exists */
  if ('error' in ticketResult) {
    throw {
      status: ticketResult.error === 'Ticket not found' ? 404 : 400,
      message: ticketResult.error,
    } satisfies ServiceError
  }

  const { status, priority, assigneeId, requesterId } = body
  const data: Record<string, unknown> = {}
/* check if status is provided and valid */
  if (status !== undefined) {
    const mappedStatus = statusMap[status]
    if (!mappedStatus) {
      throw { status: 400, message: 'Invalid status value' } satisfies ServiceError
    }
    data.status = mappedStatus
  }

  if (priority !== undefined) {
    const mappedPriority = priorityMap[priority]
    if (!mappedPriority) {
      throw { status: 400, message: 'Invalid priority value' } satisfies ServiceError
    }
    data.priority = mappedPriority
  }
/* Determine if requesterId is provided and valid */
  if (requesterId !== undefined) {
    const requesterResult = await parseUserId(requesterId)
    if ('error' in requesterResult) {
      throw {
        status: requesterResult.error === 'User not found' ? 404 : 400,
        message: requesterResult.error,
      } satisfies ServiceError
    }
    data.requester = { connect: { id: requesterId } }
  }

  if (assigneeId !== undefined) {
    if (assigneeId === null) {
      data.assignee = { disconnect: true }
    } else {
      const assigneeResult = await parseUserId(assigneeId)
      if ('error' in assigneeResult) {
        throw {
          status: assigneeResult.error === 'User not found' ? 404 : 400,
          message: assigneeResult.error,
        } satisfies ServiceError
      }
      data.assignee = { connect: { id: assigneeId } }
    }
  }

  try {
    return await prisma.ticket.update({
      where: { id: ticketResult.ticketId },
      data,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    })
  } catch {
    throw {
      status: 500,
      message: 'Something went wrong while updating the ticket',
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

export async function createTicketMessage(rawTicketId: string | string[], body: { body?: string }, authorId: number) {
  const result = await parseTicketId(rawTicketId)

  if ('error' in result) {
    throw {
      status: result.error === 'Ticket not found' ? 404 : 400,
      message: result.error,
    } satisfies ServiceError
  }

  const messageBody = body.body

  if (!messageBody || messageBody.trim().length === 0) {
    throw {
      status: 400,
      message: 'Message body is required',
    } satisfies ServiceError
  }

  try {
    return await prisma.ticketMessage.create({
      data: {
        ticketId: result.ticketId,
        body: messageBody,
        authorId: authorId,
      },
    })
  } catch {
    throw {
      status: 500,
      message: 'Something went wrong while creating the ticket message',
    } satisfies ServiceError
  }
}
