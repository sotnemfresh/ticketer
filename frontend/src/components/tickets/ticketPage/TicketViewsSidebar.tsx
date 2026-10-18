import { Link, useSearchParams } from "react-router-dom"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useTickets } from "@/services/ticketService"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { ticketViews, DEFAULT_VIEW_ID } from "./TicketViews"

export default function TicketViewsSidebar() {
    const [params] = useSearchParams()
    const { data: tickets = [] } = useTickets()
    const { data: currentUser } = useCurrentUser()
    const activeId = params.get("view") ?? DEFAULT_VIEW_ID

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Views</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {ticketViews.map((view) => (
                        <SidebarMenuItem key={view.id}>
                            <SidebarMenuButton
                                isActive={view.id === activeId}
                                render={<Link to={`/tickets?view=${view.id}`} />}
                            >
                                {view.label}
                            </SidebarMenuButton>
                            <SidebarMenuBadge>
                                {tickets.filter((t) => view.filter(t, currentUser?.id)).length}
                            </SidebarMenuBadge>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}