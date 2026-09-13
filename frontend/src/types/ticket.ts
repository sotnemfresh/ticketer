export type TicketStatus = 'open' | 'new' | 'pending' | 'closed' | 'solved' 

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Ticket {
	id: number
	subject: string
	description: string
	status: TicketStatus
	priority: TicketPriority
	createdAt: Date
    updatedAt?: Date
}
