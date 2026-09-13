import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { Ticket } from '../types/ticket'

const API_URL = 'http://localhost:3000/api/tickets'

export interface CreateTicketData {
  subject: string
  description: string
  status: 'open' | 'new' | 'pending' | 'closed' | 'solved'
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

async function getTickets(): Promise<Ticket[]> {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error('Failed to fetch tickets')
  }

  return response.json()
}

async function postTicket(data: CreateTicketData): Promise<Ticket> {
  try {
    const response = await fetch(API_URL, {
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

export function useTickets() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: getTickets,
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