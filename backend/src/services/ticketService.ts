import { prisma } from '../lib/prisma.js'
import { parseTicketId } from '../helpers/ticketId.js'
import { parseUserId } from '../helpers/userId.js'
import { statusMap, priorityMap, type CreateTicketBody } from '../types/ticket.js'

export type ServiceError = {
  status: number
  message: string
}

export async function getAllTickets() {
  return prisma.ticket.findMany()
}

export async function createTicket(body: CreateTicketBody) {
  const { subject, description, status, priority, requesterId } = body

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

  const requesterIdToUse = requesterId ?? 1
  const userResult = await parseUserId(requesterIdToUse)

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
        connect: { id: requesterIdToUse },
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

export async function createTicketMessage(rawTicketId: string | string[], body: { body?: string }) {
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
        authorId: 1,
      },
    })
  } catch {
    throw {
      status: 500,
      message: 'Something went wrong while creating the ticket message',
    } satisfies ServiceError
  }
}
