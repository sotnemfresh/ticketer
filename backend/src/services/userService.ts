import { prisma } from '../lib/prisma.js'
import { parseUserId } from '../helpers/userId.js'
import { roleMap, type CreateUserBody } from '../types/user.js'

export type ServiceError = {
  status: number
  message: string
}

export async function getAllUsers() {
  return prisma.user.findMany()
}

export async function createUser(body: CreateUserBody) {
  const { name, email, role, jobTitle } = body

  if (!name || !email || !role) {
    throw {
      status: 400,
      message: 'name, email, and role are required',
    } satisfies ServiceError
  }

  const mappedRole = roleMap[role]

  if (!mappedRole) {
    throw {
      status: 400,
      message: 'Invalid role value',
    } satisfies ServiceError
  }

  try {
    return await prisma.user.create({
      data: {
        name,
        email,
        role: mappedRole,
        jobTitle: jobTitle ?? null,
      },
    })
  } catch {
    throw {
      status: 500,
      message: 'Something went wrong while creating the user',
    } satisfies ServiceError
  }
}

export async function getUserById(id: string | string[]) {
  const result = await parseUserId(id)

  if ('error' in result) {
    throw {
      status: result.error === 'User not found' ? 404 : 400,
      message: result.error,
    } satisfies ServiceError
  }

  return result.user
}
