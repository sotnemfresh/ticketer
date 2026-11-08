import type { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../lib/prisma.js'
import {
  decodeProfileTicketCursor,
  encodeProfileTicketCursor,
  parseProfileUserId,
  PROFILE_TICKET_PAGE_SIZE,
  UserProfileError,
  type ProfileTicketRelationship,
} from './userProfileInput.js'

export async function getUserProfile(rawId: unknown, database: Prisma.TransactionClient = prisma) {
  const id = parseProfileUserId(rawId)
  const user = await database.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      jobTitle: true,
      phone: true,
      avatarUrl: true,
    },
  })

  if (!user) throw new UserProfileError(404, 'User not found')
  return user
}

export async function getUserProfileTickets(
  rawId: unknown,
  rawCursor?: unknown,
  database: Prisma.TransactionClient = prisma,
) {
  const user = await getUserProfile(rawId, database)
  const relationship: ProfileTicketRelationship = user.role === 'AGENT' || user.role === 'ADMIN'
    ? 'assigned'
    : 'requested'
  const cursor = decodeProfileTicketCursor(rawCursor, user.id, relationship)
  const where: Prisma.TicketWhereInput = {
    ...(relationship === 'assigned' ? { assigneeId: user.id } : { requesterId: user.id }),
    ...(cursor ? {
      OR: [
        { createdAt: { lt: new Date(cursor.createdAt) } },
        { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
      ],
    } : {}),
  }

  const results = await database.ticket.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: PROFILE_TICKET_PAGE_SIZE + 1,
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      source: true,
      createdAt: true,
      updatedAt: true,
      requester: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  })
  const tickets = results.slice(0, PROFILE_TICKET_PAGE_SIZE)
  const last = tickets.at(-1)

  return {
    userId: user.id,
    relationship,
    tickets,
    pageSize: PROFILE_TICKET_PAGE_SIZE,
    nextCursor: results.length > PROFILE_TICKET_PAGE_SIZE && last
      ? encodeProfileTicketCursor({ userId: user.id, relationship, createdAt: last.createdAt.toISOString(), id: last.id })
      : null,
  }
}