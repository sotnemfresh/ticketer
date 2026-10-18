import { useNavigate, useSearchParams } from "react-router-dom"
import { useTickets } from "@/services/ticketService"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { ticketViews, DEFAULT_VIEW_ID } from "@/components/tickets/ticketPage/TicketViews"
import { columns } from "../../components/tickets/ticketPage/ticketList/columns"
import { DataTable } from "../../components/tickets/ticketPage/ticketList/data-table"
import { GroupedDataTable } from "../../components/tickets/ticketPage/ticketList/grouped-data-table"

export default function TicketListTable() {
    const { data: tickets = [] } = useTickets()
    const { data: currentUser } = useCurrentUser()
    const navigate = useNavigate()
    const [params] = useSearchParams()

    const view = ticketViews.find((v) => v.id === params.get("view"))
        ?? ticketViews.find((v) => v.id === DEFAULT_VIEW_ID)!

    const visible = tickets.filter((t) => view.filter(t, currentUser?.id))
    const openTicket = (t: { id: number }) => navigate(`/tickets/${t.id}`)

    return (
        <div className="container mx-auto py-10">
            {view.table === "grouped" ? (
                <GroupedDataTable columns={columns} data={visible} onRowClick={openTicket} />
            ) : (
                <DataTable
                    key={view.id}
                    columns={columns}
                    data={visible}
                    onRowClick={openTicket}
                    initialSorting={view.id === "unassigned" ? [{ id: "createdAt", desc: true }] : undefined}
                />
            )}
        </div>
    )
}