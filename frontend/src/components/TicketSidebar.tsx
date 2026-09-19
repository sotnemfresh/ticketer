import { useEffect, useState } from 'react'
import type { Ticket, TicketStatus, TicketPriority } from '../types/ticket'
import type { User } from '../types/user'
import './TicketSidebar.css'

export interface TicketSidebarChanges {
  status: TicketStatus
  priority: TicketPriority
  assigneeId?: number
  requesterId?: number
}

interface TicketSidebarProps {
  ticket?: Ticket
  users?: User[]
  onSave?: (changes: TicketSidebarChanges) => void
}

const TicketSidebar = ({ ticket, users = [], onSave }: TicketSidebarProps) => {
  const [draftStatus, setDraftStatus] = useState<TicketStatus | undefined>(ticket?.status)
  const [draftPriority, setDraftPriority] = useState<TicketPriority | undefined>(ticket?.priority)
  const [draftAssigneeId, setDraftAssigneeId] = useState<number | undefined>(ticket?.assignee?.id)
  const [draftRequesterId, setDraftRequesterId] = useState<number | undefined>(ticket?.requester?.id)


  // resync drafts whenever the underlying ticket data changes (e.g. after a save or refetch)
  useEffect(() => setDraftStatus(ticket?.status), [ticket?.status])
  useEffect(() => setDraftPriority(ticket?.priority), [ticket?.priority])
  useEffect(() => setDraftAssigneeId(ticket?.assignee?.id), [ticket?.assignee?.id])
  useEffect(() => setDraftRequesterId(ticket?.requester?.id), [ticket?.requester?.id])

  function handleSave() {
    if (!draftStatus || !draftPriority) return
    onSave?.({
      status: draftStatus,
      priority: draftPriority,
      assigneeId: draftAssigneeId,
      requesterId: draftRequesterId,
    })
  }

  return (
    <aside className="ticket-sidebar">
      <h3 className="ticket-sidebar-title">Ticket Details</h3>

      <div className="ticket-sidebar-field">
        <span className="ticket-sidebar-label">Status</span>
        <div className="ticket-sidebar-select-wrap">
          <select
            className="ticket-sidebar-select"
            value={draftStatus ?? ''}
            onChange={(e) => setDraftStatus(e.target.value as TicketStatus)}
          >
            <option value="NEW">NEW</option>
            <option value="OPEN">OPEN</option>
            <option value="PENDING">PENDING</option>
            <option value="CLOSED">CLOSED</option>
            <option value="SOLVED">SOLVED</option>
          </select>
        </div>
      </div>

      <div className="ticket-sidebar-field">
        <span className="ticket-sidebar-label">Priority</span>
        <div className="ticket-sidebar-select-wrap">
          <select
            className="ticket-sidebar-select"
            value={draftPriority ?? ''}
            onChange={(e) => setDraftPriority(e.target.value as TicketPriority)}
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
        </div>
      </div>

      <div className="ticket-sidebar-field">
        <span className="ticket-sidebar-label">Assignee</span>
        <div className="ticket-sidebar-select-wrap">
          <select
            className="ticket-sidebar-select"
            value={draftAssigneeId ?? ''}
            onChange={(e) => setDraftAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ticket-sidebar-field">
        <span className="ticket-sidebar-label">Requester</span>
        <div className="ticket-sidebar-select-wrap">
          <select
            className="ticket-sidebar-select"
            value={draftRequesterId ?? ''}
            onChange={(e) => setDraftRequesterId(e.target.value ? Number(e.target.value) : undefined)}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="button" className="ticket-sidebar-save" onClick={handleSave}>
        Save
      </button>
    </aside>
  )
}

export default TicketSidebar