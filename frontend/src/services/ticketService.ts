import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { Ticket } from '../types/ticket'
import { apiClient } from './apiClient'

const TICKET_URL = '/tickets'

export interface CreateTicketData {
  subject: string
  description: string
  status: 'open' | 'new' | 'pending' | 'closed' | 'solved'
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface UpdateTicketData {
  ticketId: number
  status?: 'open' | 'new' | 'pending' | 'closed' | 'solved'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assigneeId?: number | null
  requesterId?: number
}

async function getTickets(): Promise<Ticket[]> {
  try {
    return await apiClient(TICKET_URL)
  } catch {
    throw new Error('Failed to fetch tickets')
  }
}

async function getTicketById(ticketId: string): Promise<Ticket> {
  try {
    return await apiClient(`${TICKET_URL}/${ticketId}`)
  } catch {
    throw new Error('Failed to fetch ticket')
  }
}

async function postTicket(data: CreateTicketData): Promise<Ticket> {
  try {
    return await apiClient(TICKET_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Something went wrong while creating the ticket')
    }

    throw new Error('Something went wrong while creating the ticket')
  }
}

async function patchTicket({ ticketId, ...data }: UpdateTicketData): Promise<Ticket> {
  try {
    return await apiClient(`${TICKET_URL}/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Something went wrong while updating the ticket')
    }

    throw new Error('Something went wrong while updating the ticket')
  }
}

export function useTickets() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: getTickets,
  })
}

export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => getTicketById(ticketId),
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tickets'],
      })
    },
  })
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: patchTicket,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', String(variables.ticketId)] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}