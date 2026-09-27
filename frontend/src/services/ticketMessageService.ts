import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { TicketMessage } from '../types/ticketMessage'
import { apiClient } from './apiClient'

export interface CreateMessageData {
  ticketId: number
  body: string
}

async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  try {
    const rawMessages = await apiClient(`/tickets/${ticketId}/messages`)

    return Promise.all(
      rawMessages.map(async (message: TicketMessage) => {
        if (!message.authorId) {
          return message
        }

        try {
          const user = await apiClient(`/users/${message.authorId}`)

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
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 404) {
      return []
    }

    throw new Error('Failed to fetch ticket messages')
  }
}

async function postMessage(data: CreateMessageData): Promise<TicketMessage> {
  try {
    return await apiClient(`/tickets/${data.ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: data.body }),
    })
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Something went wrong while creating the ticket message')
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