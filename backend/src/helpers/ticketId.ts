import { prisma } from '../lib/prisma.js'

type ParseTicketIdResult =
  | { ticketId: number; ticket: { id: number } }
  | { error: 'Ticket id must be a single value' | 'Ticket id must be a number' | 'Ticket not found' }

export async function parseTicketId(
  rawTicketId: string | string[]
): Promise<ParseTicketIdResult> {
  if (Array.isArray(rawTicketId)) {
    return { error: 'Ticket id must be a single value' }
  }

  const ticketId = Number.parseInt(rawTicketId, 10)

  if (Number.isNaN(ticketId)) {
    return { error: 'Ticket id must be a number' }
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  })

  if (!ticket) {
    return { error: 'Ticket not found' }
  }

  return { ticketId, ticket }
}