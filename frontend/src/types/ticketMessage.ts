export interface TicketMessage {
  id: number
  ticketId: number
  body: string
  createdAt: string
  authorId?: number
  authorName?: string
}