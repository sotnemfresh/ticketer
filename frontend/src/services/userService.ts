import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { User } from '../types/user'

const API_URL = import.meta.env.VITE_API_URL
const USER_URL = `${API_URL}/users`

async function getUsers(): Promise<User[]> {
  const response = await fetch(USER_URL)

  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }

  return response.json()
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })
}