import { useNavigate } from "react-router-dom"
import { useTickets } from "@/services/ticketService"
import { columns } from "./columns"
import { DataTable } from "./data-table"


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