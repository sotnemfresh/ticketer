export interface User {
  id: number
  name: string
  email: string
  role: string
  jobTitle?: string | null
}

export const roleMap = {
  admin: 'ADMIN',
  agent: 'AGENT',
  viewer: 'VIEWER',
} as const

export type CreateUserBody = {
  name?: string
  email?: string
  role?: keyof typeof roleMap
  jobTitle?: string | null
}
