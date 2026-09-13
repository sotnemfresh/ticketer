import { prisma } from '../lib/prisma.js'

type ParseUserIdResult =
  | { userId: number; user: { id: number } }
  | { error: 'User id must be a single value' | 'User id must be a number' | 'User not found' }

export async function parseUserId(
  rawUserId: string | string[] | number
): Promise<ParseUserIdResult> {
  if (Array.isArray(rawUserId)) {
    return { error: 'User id must be a single value' }
  }

  if (typeof rawUserId === 'number') {
    if (Number.isNaN(rawUserId)) {
      return { error: 'User id must be a number' }
    }

    const user = await prisma.user.findUnique({
      where: { id: rawUserId },
    })

    if (!user) {
      return { error: 'User not found' }
    }

    return { userId: rawUserId, user }
  }

  const userId = Number.parseInt(rawUserId, 10)

  if (Number.isNaN(userId)) {
    return { error: 'User id must be a number' }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return { error: 'User not found' }
  }

  return { userId, user }
}
