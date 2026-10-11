import { Outlet, useMatch } from "react-router-dom"
import Navbar from "./Navbar"
import { AppSidebar } from "./app-sidebar"
import { IconRail } from "./IconRail"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TicketDraftProvider } from "@/components/tickets/ticketDetailPage/TicketMessages/TicketDraftContext"

export default function AppLayout() {
    const detailMatch = useMatch("/tickets/:ticketId")

    const sidebarAndPage = (
        <>
            <AppSidebar />
            <main className="min-w-0 flex-1 overflow-auto">
                <Outlet />
            </main>
        </>
    )
    return (
        <TooltipProvider>
            <div className="flex h-svh flex-col overflow-hidden bg-background">
                <Navbar />

                <div className="flex min-h-0 flex-1">
                    <IconRail />
                    <SidebarProvider className="relative min-h-0 flex-1">
                        {detailMatch ? (
                            <TicketDraftProvider key={detailMatch.params.ticketId}>
                                {sidebarAndPage}
                            </TicketDraftProvider>
                        ) : (
                            sidebarAndPage
                        )}
                    </SidebarProvider>
                </div>
            </div>
        </TooltipProvider>
    )
}