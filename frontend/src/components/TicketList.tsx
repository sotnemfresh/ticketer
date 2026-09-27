import { Link } from 'react-router-dom'
import type { Ticket } from '../types/ticket'

interface TicketListProps {
    tickets: Ticket[]
}

export function TicketList({ tickets }: TicketListProps) {

    return (
        <div>
            <ul>
                {tickets.map((ticket) => {
                    return (
                        <li key={ticket.id}>
                            <Link className="ticket-link" to={`/tickets/${ticket.id}`}>
                            <h2>{ticket.subject}</h2>
                            <p>{ticket.description}</p>
                            <span>Status: {ticket.status}</span>
                            <span>Priority: {ticket.priority}</span>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
};