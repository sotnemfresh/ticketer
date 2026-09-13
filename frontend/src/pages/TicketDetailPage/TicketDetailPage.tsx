import { useNavigate, useParams } from 'react-router-dom'
import './TicketDetailPage.css'

const TicketDetailPage = () => {
    const navigate = useNavigate()
    const { ticketId } = useParams()

    const ticket = {
        subject: 'Printer broken',
        status: 'Open',
        priority: 'High',
        description: "The printer won't print.",
        customer: 'John Smith',
    }
    
    return (
        <main className="ticket-detail-page">
            <div>
                <button type="button" onClick={() => navigate('/tickets')}>
                    ← Back to tickets
                </button>
                <article className="ticket-detail">
                    <p className="ticket-id">Ticket #{ticketId}</p>

                    <h1>{ticket.subject}</h1>

                    <div className="ticket-meta">
                        <p>
                            <strong>Status:</strong> {ticket.status}
                        </p>
                        <p>
                            <strong>Priority:</strong> {ticket.priority}
                        </p>
                    </div>

                    <section>
                        <h2>Description</h2>
                        <p className="description">{ticket.description}</p>
                    </section>

                    <section>
                        <h2>Customer</h2>
                        <p>{ticket.customer}</p>
                    </section>

                    <div className="ticket-actions">
                        <button type="button">Reply</button>
                        <button type="button">Change status</button>
                    </div>
                </article>
            </div>
        </main>
    )
}

export default TicketDetailPage