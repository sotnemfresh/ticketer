export const PROFILE_TICKET_PAGE_SIZE = 30
const MAX_ID = 2147483647

export class UserProfileError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
  }
}

export type ProfileTicketRelationship = 'assigned' | 'requested'

type ProfileTicketCursor = {
  userId: number
  relationship: ProfileTicketRelationship
  createdAt: string
  id: number
}

export function parseProfileUserId(rawId: unknown): number {
  const id = typeof rawId === 'string' && /^\d+$/.test(rawId) ? Number(rawId) : rawId
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 1 || id > MAX_ID) {
    throw new UserProfileError(400, 'User id must be a positive integer')
  }
  return id
}

export function decodeProfileTicketCursor(
  rawCursor: unknown,
  userId: number,
  relationship: ProfileTicketRelationship,
): ProfileTicketCursor | null {
  if (rawCursor === undefined) return null
  if (typeof rawCursor !== 'string' || rawCursor.length > 1024 || !/^[A-Za-z0-9_-]+$/.test(rawCursor)) {
    throw new UserProfileError(400, 'Invalid profile ticket cursor')
  }

  try {
    const cursor: unknown = JSON.parse(Buffer.from(rawCursor, 'base64url').toString('utf8'))
    if (
      !cursor || typeof cursor !== 'object' ||
      !('userId' in cursor) || cursor.userId !== userId ||
      !('relationship' in cursor) || cursor.relationship !== relationship ||
      !('id' in cursor) || typeof cursor.id !== 'number' ||
      !Number.isInteger(cursor.id) || cursor.id < 1 || cursor.id > MAX_ID ||
      !('createdAt' in cursor) || typeof cursor.createdAt !== 'string' ||
      new Date(cursor.createdAt).toISOString() !== cursor.createdAt
    ) {
      throw new Error('Invalid cursor fields')
    }
    return { userId, relationship, id: cursor.id, createdAt: cursor.createdAt }
  } catch {
    throw new UserProfileError(400, 'Invalid cursor or cursor belongs to another profile or relationship')
  }
}

export function encodeProfileTicketCursor(cursor: ProfileTicketCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url')
}