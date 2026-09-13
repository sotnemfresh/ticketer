export interface Ticket {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt?: Date;
}

export const statusMap = {
  open: 'OPEN',
  new: 'NEW',
  pending: 'PENDING',
  closed: 'CLOSED',
  solved: 'SOLVED',
} as const

export const priorityMap = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
  urgent: 'URGENT',
} as const

export type CreateTicketBody = {
  subject?: string
  description?: string
  status?: keyof typeof statusMap
  priority?: keyof typeof priorityMap
  requesterId?: number
}