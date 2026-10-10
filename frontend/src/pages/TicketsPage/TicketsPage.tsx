import './TicketsPage.css'
import { useState } from 'react'
import TicketForm, { type NewTicketData } from '../../components/tickets/ticketPage/TicketForm'
import { TicketList } from '../../components/tickets/ticketPage/TicketList'
import { useCreateTicket, useTickets } from '../../services/ticketService'
import TicketSearch from "../../components/tickets/ticketPage/TicketSearch";
import { Button } from '@/components/ui/button'

export default function TicketsPage() {
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false)
    /* Fetch the list of tickets */
    const { data: tickets = [], isLoading } = useTickets()
    const createTicket = useCreateTicket()

    const filteredTickets = tickets.filter((ticket) =>
        ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
        String(ticket.id).includes(search.trim())
    );

    async function addTicket(data: NewTicketData) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await createTicket.mutateAsync(data)
    }

    if (isLoading) {
        return <p>Loading tickets...</p>;
    }

    return (
        <div className="tickets-page">
            <div className="tickets-page-header">

                {/* Title */}
                <h1>Tickets Page</h1>

                {/* Buttons to show new ticket form */}
                <Button type="button" onClick={() => setShowForm(true)}>
                    New Ticket
                </Button>
                {showForm && (
                    <TicketForm onSubmit={addTicket} onCancel={() => setShowForm(false)} />
                )}

                <div className="tickets-search">
                    <TicketSearch
                        value={search}
                        onChange={setSearch}
                    />
                </div>


            </div>


            {/* Ticket List */}
            <div className="ticket-list-container">

                {filteredTickets && <TicketList tickets={filteredTickets} />}

            </div>

        </div>
    )
}