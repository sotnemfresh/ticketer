// TicketDetailPage.tsx
import { useNavigate, useParams } from 'react-router-dom'
import TicketMessageForm, { type NewMessageData } from '../../components/TicketMessageForm'
import { TicketMessageList } from '../../components/TicketMessageList'
import TicketSidebar from '../../components/TicketSidebar'
import { useCreateMessage, useTicketMessages } from '../../services/ticketMessageService'
import './TicketDetailPage.css'

export default function TicketDetailPage() {
    const navigate = useNavigate()
    const { ticketId } = useParams()
    const numericTicketId = Number(ticketId)

    const { data: messages = [], isLoading } = useTicketMessages(String(numericTicketId))
    const createMessage = useCreateMessage()

    async function handleSendMessage(data: NewMessageData) {
        await createMessage.mutateAsync({
            ticketId: data.ticketId,
            body: data.body,
        })
    }

    return (
        <main className="ticket-detail-page">
            <button type="button" onClick={() => navigate('/tickets')}>
                ← Back to tickets
            </button>
            <section className="ticket-detail-frame">
                <h1 className="ticket-detail-title">Ticket Details</h1>

                <section className="ticket-detail-layout">
                    <TicketSidebar />

                    <section className="ticket-detail-content">
                        <section className="ticket-message-list-box">
                            <TicketMessageList ticketMessages={messages} />
                        </section>

                        <TicketMessageForm
                            ticketId={numericTicketId}
                            onSubmit={handleSendMessage}
                        />
                    </section>
                </section>

                {isLoading && <p className="ticket-detail-loading">Loading messages...</p>}
            </section>
        </main>
    )
}