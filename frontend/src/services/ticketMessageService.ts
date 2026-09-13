import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { TicketMessage } from '../types/ticketMessage'

const API_URL = import.meta.env.VITE_API_URL
const USERS_API_URL = `${API_URL?.replace(/\/tickets\/?$/, '')}/users`

export interface CreateMessageData {
  ticketId: number
  body: string
}

async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const response = await fetch(`${API_URL}/${ticketId}/messages`)

  if (!response.ok) {
    throw new Error('Failed to fetch ticket messages')
  }

  const rawMessages = await response.json()

  return Promise.all(
    rawMessages.map(async (message: TicketMessage) => {
      if (!message.authorId) {
        return message
      }

      try {
        const userResponse = await fetch(`${USERS_API_URL}/${message.authorId}`)

        if (!userResponse.ok) {
          return {
            ...message,
            authorName: 'Unknown author',
          }
        }

        const user = await userResponse.json()

        return {
          ...message,
          authorName: user.name,
        }
      } catch {
        return {
          ...message,
          authorName: 'Unknown author',
        }
      }
    }),
  )
}

async function postMessage(data: CreateMessageData): Promise<TicketMessage> {
  try {
    const response = await fetch(`${API_URL}/${data.ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: data.body }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'Something went wrong.' }))
      throw new Error(body.message ?? 'Something went wrong while creating the ticket message')
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }

    throw new Error('Something went wrong while creating the ticket message')
  }
}

export function useTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: ['ticketMessages', ticketId],
    queryFn: () => getTicketMessages(ticketId),
  })
}

export function useCreateMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ticketMessages'],
      })
    },
  })
}