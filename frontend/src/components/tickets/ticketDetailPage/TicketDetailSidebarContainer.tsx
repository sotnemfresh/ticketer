import { useTicket, useUpdateTicket } from "@/services/ticketService"
import TicketDetailSidebar from "./TicketDetailSidebar"
import { useUsers } from "@/services/userService"


export default function TicketDetailSidebarContainer({ ticketId }: { ticketId: string }) {
  const { data: ticket } = useTicket(ticketId)       // uses getTicketById
  const { data: users = [] } = useUsers()
  const updateTicket = useUpdateTicket()             // uses patchTicket

  if (!ticket) return null

  return (
    <TicketDetailSidebar
      ticket={ticket}
      users={users}
    />
  )
}