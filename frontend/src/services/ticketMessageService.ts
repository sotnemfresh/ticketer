import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { TicketMessage } from '../types/ticketMessage'
import type { Ticket, TicketUpdateChanges } from '../types/ticket'
import { apiClient } from './apiClient'

export interface CreateMessageData {
  ticketId: number
  body: string
}

export interface SubmitTicketUpdateData {
  ticketId: number
  changes?: TicketUpdateChanges
  message?: string
}

export interface SubmitTicketUpdateResponse {
  ticket: Ticket
  message: TicketMessage | null
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

async function postTicketUpdate(data: SubmitTicketUpdateData): Promise<SubmitTicketUpdateResponse> {
  try {
    const changes = data.changes
    const apiChanges = changes && {
      ...changes,
      ...(changes.status
        ? { status: changes.status.toUpperCase().replaceAll('-', '_') }
        : {}),
      ...(changes.priority ? { priority: changes.priority.toUpperCase() } : {}),
    }

    return await apiClient(`/tickets/${data.ticketId}/updates`, {
      method: 'POST',
      body: JSON.stringify({
        ...(apiChanges && Object.keys(apiChanges).length > 0 ? { changes: apiChanges } : {}),
        ...(data.message?.trim() ? { message: data.message.trim() } : {}),
      }),
    })
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Something went wrong while submitting the ticket update')
    }

    throw new Error('Something went wrong while submitting the ticket update')
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
    mutationFn: (data: CreateMessageData) =>
      postTicketUpdate({ ticketId: data.ticketId, message: data.body }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticketMessages', String(variables.ticketId)] })
      queryClient.invalidateQueries({ queryKey: ['ticket', String(variables.ticketId)] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useSubmitTicketUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postTicketUpdate,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['ticketMessages', String(variables.ticketId)],
      })
      queryClient.invalidateQueries({
        queryKey: ['ticket', String(variables.ticketId)],
      })
      queryClient.invalidateQueries({
        queryKey: ['tickets'],
      })
    },
  })
}