import { Link } from 'react-router-dom'
import type { Ticket } from '../types/ticket'

interface TicketListProps {
    tickets: Ticket[]
}

export function TicketList({ tickets }: TicketListProps) {
    // const [tickets, setTickets] = useState([
    //     { id: 1, subject: 'Ticket 1', description: 'Description for Ticket 1', status: "new", priority: "high" },
    //     { id: 2, subject: 'Ticket 2', description: 'Description for Ticket 2', status: "in-progress", priority: "medium" },
    //     { id: 3, subject: 'Ticket 3', description: 'Description for Ticket 3', status: "resolved", priority: "low" },
    // ]);

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