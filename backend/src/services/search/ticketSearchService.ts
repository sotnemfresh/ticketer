import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../lib/prisma.js'
import { encodeSearchCursor, SEARCH_PAGE_SIZE, type TicketSearchInput } from './searchInput.js'

type TicketMatch = { id: number; createdAt: Date }

export async function searchTickets(input: TicketSearchInput, database: Prisma.TransactionClient = prisma) {
  const boundary = input.cursor
    ? Prisma.sql`WHERE (ticket."createdAt", ticket.id) < (${new Date(input.cursor.createdAt)}::timestamp, ${input.cursor.id}::integer)`
    : Prisma.empty

  const matches = await database.$queryRaw<TicketMatch[]>(Prisma.sql`
    WITH terms AS (
      SELECT word, to_tsquery('simple'::regconfig, quote_literal(word)) AS query
      FROM unnest(tsvector_to_array(to_tsvector('simple'::regconfig, ${input.query}))) AS words(word)
    ), word_matches AS (
      SELECT terms.word, ticket.id AS "ticketId"
      FROM terms
      JOIN "Ticket" AS ticket ON
        to_tsvector('simple'::regconfig, coalesce(ticket.subject, '') || ' ' || coalesce(ticket.description, '')) @@ terms.query
      UNION
      SELECT terms.word, message."ticketId"
      FROM terms
      JOIN "TicketMessage" AS message ON
        to_tsvector('simple'::regconfig, message."bodyText") @@ terms.query
      UNION
      SELECT terms.word, ticket.id
      FROM terms
      JOIN "User" AS person ON to_tsvector('simple'::regconfig, person.name) @@ terms.query
      JOIN "Ticket" AS ticket ON ticket."requesterId" = person.id OR ticket."assigneeId" = person.id
      UNION
      SELECT terms.word, ticket.id
      FROM terms
      JOIN "Ticket" AS ticket ON ticket.id = ${input.ticketId}::integer
    ), matching_tickets AS (
      SELECT "ticketId"
      FROM word_matches
      GROUP BY "ticketId"
      HAVING count(*) = (SELECT count(*) FROM terms)
    )
    SELECT ticket.id, ticket."createdAt"
    FROM matching_tickets
    JOIN "Ticket" AS ticket ON ticket.id = matching_tickets."ticketId"
    ${boundary}
    ORDER BY ticket."createdAt" DESC, ticket.id DESC
    LIMIT ${SEARCH_PAGE_SIZE + 1}
  `)

  const page = matches.slice(0, SEARCH_PAGE_SIZE)
  const tickets = page.length ? await database.ticket.findMany({
    where: { id: { in: page.map((ticket) => ticket.id) } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
  }) : []

  const last = page.at(-1)
  return {
    tickets,
    pageSize: SEARCH_PAGE_SIZE,
    nextCursor: matches.length > SEARCH_PAGE_SIZE && last
      ? encodeSearchCursor({ query: input.query, createdAt: last.createdAt.toISOString(), id: last.id })
      : null,
  }
}