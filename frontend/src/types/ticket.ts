import type { User } from "./user";

export type TicketStatus = 'open' | 'new' | 'pending' | 'on-hold' | 'closed' | 'solved'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TicketUpdateChanges {
    subject?: string
    status?: TicketStatus
    priority?: TicketPriority
    assigneeId?: number | null
    requesterId?: number
}

export interface Ticket {
    id: number
    subject: string
    description: string
    status: TicketStatus
    priority: TicketPriority

    requester?: User
    assignee?: User

    createdAt: Date
    updatedAt?: Date
}