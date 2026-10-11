import { useTicket } from "@/services/ticketService"
import TicketDetailSidebar from "./TicketDetailSidebar"
import { useUsers } from "@/services/userService"
import { useTicketDraft } from "./TicketMessages/TicketDraftContext"
import type { TicketPriority } from "@/types/ticket"


export default function TicketDetailSidebarContainer({ ticketId }: { ticketId: string }) {
  const { data: ticket } = useTicket(ticketId)
  const { data: users = [] } = useUsers()
  const { draft, updateDraft } = useTicketDraft()

  if (!ticket) return null

  return (
    <TicketDetailSidebar
      ticket={ticket}
      users={users}
      priority={draft.priority ?? ticket.priority.toLowerCase() as TicketPriority}
      requesterId={draft.requesterId ?? ticket.requester?.id}
      assigneeId={
        draft.assigneeId !== undefined
          ? draft.assigneeId
          : ticket.assignee?.id ?? null
      }
      onRequesterChange={(requesterId) => updateDraft({ requesterId })}
      onAssigneeChange={(assigneeId) => updateDraft({ assigneeId })}
      onPriorityChange={(priority) => updateDraft({ priority: priority as TicketPriority })}
    />
  )
}