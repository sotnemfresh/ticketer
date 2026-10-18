export interface Ticket {
  id: number;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt?: Date;
}

export const statusMap = {
  OPEN: 'OPEN',
  NEW: 'NEW',
  PENDING: 'PENDING',
  ON_HOLD: 'ON_HOLD',
  CLOSED: 'CLOSED',
  SOLVED: 'SOLVED',
} as const

export const priorityMap = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const

export type CreateTicketBody = {
  subject?: string
  description?: string
  status?: keyof typeof statusMap
  priority?: keyof typeof priorityMap
  requesterId?: number
  assigneeId?: number | null
}

export type UpdateTicketBody = {
  subject?: string
  status?: keyof typeof statusMap
  priority?: keyof typeof priorityMap
  assigneeId?: number | null
  requesterId?: number
}

export type SubmitTicketUpdateBody = {
  changes?: UpdateTicketBody
  message?: string
  messageType?: 'OUTBOUND' | 'INTERNAL_NOTE'
}