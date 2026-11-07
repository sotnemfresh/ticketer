import type { User } from "./user";

export type TicketStatus = 'open' | 'new' | 'pending' | 'on-hold' | 'closed' | 'solved'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TicketCcRecipient {
    id: number
    email: string
    userId: number | null
    user: {
        id: number
        name: string
        email: string
    } | null
}

export interface TicketUpdateChanges {
    subject?: string
    status?: TicketStatus
    priority?: TicketPriority
    assigneeId?: number | null
    requesterId?: number
    ccEmails?: string[]
}

export interface Ticket {
    id: number
    subject: string
    description: string | null
    status: TicketStatus
    priority: TicketPriority

    requester?: User
    assignee?: User
    ccRecipients?: TicketCcRecipient[]

    createdAt: Date
    updatedAt?: Date
}