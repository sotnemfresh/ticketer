import { Link } from 'react-router-dom'
import type { Ticket } from '../types/ticket'
import './TicketList.css'
import { formatRelativeTime } from '../helpers/formatRelativeTime'


interface TicketListProps {
    tickets: Ticket[]
}

export function TicketList({ tickets }: TicketListProps) {
    return (
        <>
            <div className="ticket-list-header">
                <span className="cell id">ID</span>
                <span className="cell subject">Subject</span>
                <span className="cell status">Status</span>
                <span className="cell priority">Priority</span>
                <span className="cell requester">Requester</span>
                <span className="cell assignee">Assignee</span>
                <span className="cell created">Created</span>
                <span className="cell updated">Updated</span>
            </div>
            <ul className="ticket-list">
                {tickets.map((ticket) => (
                    <li key={ticket.id} className="ticket-row" title={ticket.description}>
                        <Link className="ticket-link" to={`/tickets/${ticket.id}`}>
                            <span className="cell id">#{ticket.id}</span>
                            <span className="cell subject">{ticket.subject}</span>
                            <span className="cell status">{ticket.status}</span>
                            <span className="cell priority">{ticket.priority}</span>
                            <span className="cell requester">{ticket.requester?.name ?? '—'}</span>
                            <span className="cell assignee">{ticket.assignee?.name ?? '—'}</span>
                            <span className="cell created">{formatRelativeTime(ticket.createdAt)}</span>
                            <span className="cell updated">{ticket.updatedAt ? formatRelativeTime(ticket.updatedAt) : '—'}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </>
    )
}