import { useNavigate } from "react-router-dom"
import { useTickets } from "@/services/ticketService"
import { columns } from "../../components/tickets/ticketPage/ticketList/columns"
import { DataTable } from "../../components/tickets/ticketPage/ticketList/data-table"


export default function TicketListTable() {
    const { data: tickets = [], isLoading } = useTickets()
    const navigate = useNavigate()

    return (
        <div className="container mx-auto py-10">
            <DataTable
                columns={columns}
                data={tickets}
                onRowClick={(ticket) => navigate(`/tickets/${ticket.id}`)}
            />
        </div>
    )
}