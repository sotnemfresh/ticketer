import './TicketsPage.css'
import { useState } from 'react'
import TicketForm, { type NewTicketData } from '../../components/TicketForm'
import { TicketList } from '../../components/TicketList'
import { useCreateTicket, useTickets } from '../../services/ticketService'

export default function TicketsPage() {
    const [showForm, setShowForm] = useState(false)
    const { data: tickets = [], isLoading } = useTickets()
    const createTicket = useCreateTicket()

    async function addTicket(data: NewTicketData) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await createTicket.mutateAsync(data)
    }

    if (isLoading) {
        return <p>Loading tickets...</p>;
    }

    return (
        <div className="tickets-page">

            {/* Title */}
            <h1>Tickets Page</h1>

            {/* Buttons to show new ticket form */}
            <button type="button" onClick={() => setShowForm(true)}>
                New Ticket
            </button>
            {showForm && (
                <TicketForm onSubmit={addTicket} onCancel={() => setShowForm(false)} />
            )}

            {/* Ticket List */}


            {tickets && <TicketList tickets={tickets} />}



        </div>
    )
}