// TicketDetailPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TicketMessageForm, { type NewMessageData } from '../../components/TicketMessageForm'
import { TicketMessageList } from '../../components/TicketMessageList'
import TicketSidebar, { type TicketSidebarChanges } from '../../components/TicketSidebar'
import { useCreateMessage, useTicketMessages } from '../../services/ticketMessageService'
import './TicketDetailPage.css'
import { useTicket, useUpdateTicket } from '../../services/ticketService'
import { useUsers } from '../../services/userService'
import { diffChanges } from '../../helpers/diffChanges'


export default function TicketDetailPage() {
    const navigate = useNavigate()
    const [saveError, setSaveError] = useState<string | null>(null)
    /* Get the ticket ID from the URL parameters and convert it to a number */
    const { ticketId } = useParams()
    /* Convert the ticket ID to a number */
    const numericTicketId = Number(ticketId)
    /* Fetch the ticket data using the numeric ticket ID, 
    also includes the requester and assignee */
    const { data: ticket } = useTicket(String(numericTicketId))

    /* Fetch the list of users */
    const { data: users = [] } = useUsers()


    const updateTicket = useUpdateTicket()
    useEffect(() => {
        if (!updateTicket.isError) return

        const message = updateTicket.error instanceof Error
            ? updateTicket.error.message
            : 'Something went wrong while saving the ticket updates.'

        setSaveError(message)

        const timeoutId = setTimeout(() => setSaveError(null), 4000)
        return () => clearTimeout(timeoutId)
    }, [updateTicket.isError, updateTicket.error])


    /* Fetch the messages for the ticket using the numeric ticket ID */
    const { data: messages = [], isLoading } = useTicketMessages(String(numericTicketId))
    const createMessage = useCreateMessage()

    async function handleUpdateTicket(data: TicketSidebarChanges) {
        const original = {
            status: ticket?.status,
            priority: ticket?.priority,
            assigneeId: ticket?.assignee?.id,
            requesterId: ticket?.requester?.id,
        }

        const changes = diffChanges(original, data)

        if (Object.keys(changes).length === 0) return
        console.log('Changes to be saved:', { ticketId: numericTicketId, ...changes })

        await updateTicket.mutateAsync({ ticketId: numericTicketId, ...changes })
    }

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
                <h1 className="ticket-detail-title">{ticket?.subject ?? 'Ticket Details'}</h1>

                <section className="ticket-detail-layout">
                    <TicketSidebar
                        ticket={ticket}
                        users={users}
                        onSave={handleUpdateTicket}
                    />

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
                {saveError && (
                    <p className="ticket-detail-loading">
                        {updateTicket.error instanceof Error ? updateTicket.error.message : 'Something went wrong while saving the ticket updates.'}
                    </p>
                )}
            </section>
        </main>
    )
}