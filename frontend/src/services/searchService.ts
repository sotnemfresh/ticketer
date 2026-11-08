import { useQuery } from '@tanstack/react-query'
import { apiClient } from './apiClient'
import type { TicketStatus, TicketPriority } from '../types/ticket'

type PersonSummary = { id: number; name: string; email: string }

export interface SearchTicket {
  id: number
  subject: string
  status: TicketStatus
  priority: TicketPriority
  source: 'WEB' | 'EMAIL'
  createdAt: string
  updatedAt: string
  requester: PersonSummary
  assignee: PersonSummary | null
}

interface TicketSearchResponse {
  tickets: SearchTicket[]
  pageSize: number
  nextCursor: string | null
}

type RawSearchTicket = Omit<SearchTicket, 'status' | 'priority'> & {
  status: string
  priority: string
}

async function searchTickets(
  query: string,
  cursor: string | null,
  signal: AbortSignal,
): Promise<TicketSearchResponse> {
  const params = new URLSearchParams({ q: query })
  if (cursor) params.set('cursor', cursor)

  const result: Omit<TicketSearchResponse, 'tickets'> & {
    tickets: RawSearchTicket[]
  } = await apiClient(`/search/tickets?${params}`, { signal })

  return {
    ...result,
    tickets: result.tickets.map((ticket) => ({
      ...ticket,
      status: ticket.status.toLowerCase().replaceAll('_', '-') as TicketStatus,
      priority: ticket.priority.toLowerCase() as TicketPriority,
    })),
  }
}

export function useTicketSearch(submittedQuery: string, cursor: string | null = null) {
  const query = submittedQuery.trim()

  return useQuery({
    queryKey: ['search', 'tickets', query, cursor],
    queryFn: ({ signal }) => searchTickets(query, cursor, signal),
    enabled: query.length > 0 && query.length <= 200,
  })
}