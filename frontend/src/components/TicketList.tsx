import { Link } from 'react-router-dom'
import type { Ticket } from '../types/ticket'

interface TicketListProps {
    tickets: Ticket[]
}

export function TicketList({ tickets }: TicketListProps) {

    console.log("Rendering with items:", tickets)

    return (
        <div>
            <ul>
                {tickets.map((ticket) => {
                    return (
                        <li key={ticket.id}>
                            <Link className="ticket-link" to={`/ticket/${ticket.id}`}>
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