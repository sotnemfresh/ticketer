import { useMatch } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar"
import TicketViewsSidebar from "@/components/tickets/ticketPage/TicketViewsSidebar"
import TicketDetailSidebarContainter from "@/components/tickets/ticketDetailPage/TicketDetailSidebarContainer"


export function AppSidebar() {
  const detailMatch = useMatch("/tickets/:ticketId")
  
  return (
    <Sidebar>
      <SidebarContent className="p-4">
        {detailMatch ? (
          <TicketDetailSidebarContainter ticketId={String(detailMatch.params.ticketId)} />
        ) : (
          <TicketViewsSidebar />
        )}
      </SidebarContent>
    </Sidebar>
  )
}