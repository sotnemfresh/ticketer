import type { TicketMessage } from '../types/ticketMessage'

interface TicketMessageListProps {
    ticketMessages: TicketMessage[]
}

export function TicketMessageList({ ticketMessages }: TicketMessageListProps) {
    if (ticketMessages.length === 0) {
        return (
            <div className="message-card">
                <p>No messages have been made in this ticket.</p>
            </div>
        )
    }

    return (
        <div className="message-card">
            <ul>
                {ticketMessages.map((message) => (
                    <li key={message.id}>
                        <p>
                            <strong>{message.authorName ?? 'Unknown author'}</strong>
                            <span> — {new Date(message.createdAt).toLocaleString()}</span>
                        </p>
                        <p>{message.body}</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}