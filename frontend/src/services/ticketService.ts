import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { Ticket, TicketPriority, TicketStatus } from '../types/ticket'
import { apiClient } from './apiClient'

const TICKET_URL = '/tickets'

export interface CreateTicketData {
  subject: string
  status?: TicketStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  requesterId?: number
  assigneeId?: number | null
}

export interface UpdateTicketData {
  ticketId: number
  subject?: string
  status?: 'open' | 'new' | 'pending' | 'on-hold' | 'closed' | 'solved'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assigneeId?: number | null
  requesterId?: number
}

function normalizeTicket(t: Ticket): Ticket {
  return {
    ...t,
    status: t.status.toLowerCase().replaceAll('_', '-') as TicketStatus,
    priority: t.priority.toLowerCase() as TicketPriority,
  }
}

async function getTickets(): Promise<Ticket[]> {
  try {
    const tickets: Ticket[] = await apiClient(TICKET_URL)
    return tickets.map(normalizeTicket)
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
    const { status, priority, ...ticketData } = data
    return await apiClient(TICKET_URL, {
      method: 'POST',
      body: JSON.stringify({
        ...ticketData,
        ...(status ? { status: status.toUpperCase().replaceAll('-', '_') } : {}),
        priority: priority.toUpperCase(),
      }),
    })
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Something went wrong while creating the ticket')
    }

    throw new Error('Something went wrong while creating the ticket')
  }
}

async function postTicketUpdate({ ticketId, ...data }: UpdateTicketData): Promise<Ticket> {
  try {
    const { status, priority, ...ticketChanges } = data
    return await apiClient(`${TICKET_URL}/${ticketId}/updates`, {
      method: 'POST',
      body: JSON.stringify({ changes: {
        ...ticketChanges,
        ...(status ? { status: status.toUpperCase().replaceAll('-', '_') } : {}),
        ...(priority ? { priority: priority.toUpperCase() } : {}),
      } }),
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
    mutationFn: postTicketUpdate,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', String(variables.ticketId)] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}