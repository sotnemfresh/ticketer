import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { User } from '../types/user'
import { apiClient } from './apiClient'

const USER_URL = '/users'

async function getUsers(): Promise<User[]> {
  try {
    return await apiClient(USER_URL)
  } catch {
    throw new Error('Failed to fetch users')
  }
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })
}