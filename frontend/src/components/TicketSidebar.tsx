import './TicketSidebar.css'

const TicketSidebar = () => {
  return (
    <aside className="ticket-sidebar">
      <h3 className="ticket-sidebar-title">Ticket Details</h3>

      <div className="ticket-sidebar-field">
        <span className="ticket-sidebar-label">Status</span>
        <div className="ticket-sidebar-select-wrap">
          <select className="ticket-sidebar-select" defaultValue="OPEN">
            <option value="OPEN">OPEN</option>
            <option value="PENDING">PENDING</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </div>

      <div className="ticket-sidebar-field">
        <span className="ticket-sidebar-label">Priority</span>
        <div className="ticket-sidebar-select-wrap">
          <select className="ticket-sidebar-select" defaultValue="HIGH">
            <option value="HIGH">HIGH</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="URGENT">URGENT</option>
          </select>
        </div>
      </div>

      <div className="ticket-sidebar-field">
        <span className="ticket-sidebar-label">Assignee</span>
        <div className="ticket-sidebar-select-wrap">
          <select className="ticket-sidebar-select" defaultValue="John">
            <option value="John">John</option>
            <option value="Sarah">Sarah</option>
            <option value="Alex">Alex</option>
          </select>
        </div>
      </div>
    </aside>
  )
}

export default TicketSidebar
