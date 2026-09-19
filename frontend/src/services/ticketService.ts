import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { Ticket } from '../types/ticket'

const API_URL = import.meta.env.VITE_API_URL
const TICKET_URL = `${API_URL}/tickets`

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
  const response = await fetch(TICKET_URL)

  if (!response.ok) {
    throw new Error('Failed to fetch tickets')
  }

  return response.json()
}

async function getTicketById(ticketId: string): Promise<Ticket> {
  const response = await fetch(`${TICKET_URL}/${ticketId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch ticket')
  }

  return response.json()
}

async function postTicket(data: CreateTicketData): Promise<Ticket> {
  try {
    const response = await fetch(TICKET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'Something went wrong.' }))
      throw new Error(body.message ?? 'Something went wrong while creating the ticket')
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }

    throw new Error('Something went wrong while creating the ticket')
  }
}

async function patchTicket({ ticketId, ...data }: UpdateTicketData): Promise<Ticket> {
  try {
    const response = await fetch(`${TICKET_URL}/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'Something went wrong.' }))
      throw new Error(body.message ?? 'Something went wrong while updating the ticket')
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
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