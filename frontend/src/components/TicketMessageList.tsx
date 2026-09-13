import type { TicketMessage } from '../types/ticketMessage'

interface TicketMessageListProps {
    ticketMessages: TicketMessage[]
}


export function TicketMessageList({ ticketMessages }: TicketMessageListProps) {

    console.log("Rendering TicketMessageList with items:", ticketMessages)
    return (
        <div className="message-card">
            <ul>
                {ticketMessages.map((message) => (
                    <li key={message.id}>
                        <p>
                            <strong>Message #{message.id}</strong>
                            <span> — {new Date(message.createdAt).toLocaleString()}</span>
                        </p>
                        <p>{message.body}</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}