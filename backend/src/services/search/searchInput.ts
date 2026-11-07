export const SEARCH_PAGE_SIZE = 30
const MAX_QUERY_LENGTH = 200
const MAX_TICKET_ID = 2147483647

export class SearchInputError extends Error {}

export type SearchCursor = {
  query: string
  createdAt: string
  id: number
}

export type TicketSearchInput = {
  query: string
  ticketId: number | null
  cursor: SearchCursor | null
}

export function parseTicketSearchInput(rawQuery: unknown, rawCursor?: unknown): TicketSearchInput {
  if (typeof rawQuery !== 'string' || !rawQuery.trim() || rawQuery.trim().length > MAX_QUERY_LENGTH) {
    throw new SearchInputError(`q must contain between 1 and ${MAX_QUERY_LENGTH} characters`)
  }

  const query = rawQuery.trim()
  const numericId = /^\d+$/.test(query) ? Number(query) : NaN
  const ticketId = Number.isInteger(numericId) && numericId > 0 && numericId <= MAX_TICKET_ID
    ? numericId
    : null

  if (rawCursor === undefined) {
    return { query, ticketId, cursor: null }
  }

  if (typeof rawCursor !== 'string' || rawCursor.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(rawCursor)) {
    throw new SearchInputError('Invalid search cursor')
  }

  try {
    const cursor: unknown = JSON.parse(Buffer.from(rawCursor, 'base64url').toString('utf8'))
    if (
      !cursor || typeof cursor !== 'object' ||
      !('query' in cursor) || cursor.query !== query ||
      !('createdAt' in cursor) || typeof cursor.createdAt !== 'string' ||
      !('id' in cursor) || typeof cursor.id !== 'number' ||
      !Number.isInteger(cursor.id) || cursor.id < 1 || cursor.id > MAX_TICKET_ID ||
      new Date(cursor.createdAt).toISOString() !== cursor.createdAt
    ) {
      throw new Error('Invalid cursor fields')
    }

    return { query, ticketId, cursor: { query, createdAt: cursor.createdAt, id: cursor.id } }
  } catch {
    throw new SearchInputError('Invalid search cursor or cursor belongs to another query')
  }
}

export function encodeSearchCursor(cursor: SearchCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url')
}