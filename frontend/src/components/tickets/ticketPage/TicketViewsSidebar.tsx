import { Link, useSearchParams } from "react-router-dom"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ticketViews, DEFAULT_VIEW_ID } from "./TicketViews"

export default function TicketViewsSidebar() {
    const [params] = useSearchParams()
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
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}