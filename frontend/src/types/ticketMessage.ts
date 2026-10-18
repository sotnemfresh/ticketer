export interface TicketMessage {
  id: number
  ticketId: number
  bodyText: string
  bodyHtml?: string | null
  type: 'INBOUND' | 'OUTBOUND' | 'INTERNAL_NOTE'
  createdAt: string
  authorId?: number | null
  authorName?: string | null
  authorEmail?: string | null
  attachments?: {
    id: number
    filename: string
    mimeType: string
    size: number
    isInline: boolean
    contentId: string | null
    purgedAt: string | null
  }[]
}