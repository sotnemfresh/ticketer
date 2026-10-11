import { useEffect } from "react"
import { Outlet, useLocation, useMatch, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import Navbar from "./Navbar"
import { AppSidebar } from "./app-sidebar"
import { IconRail } from "./IconRail"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toast"
import { TicketDraftProvider } from "@/components/tickets/ticketDetailPage/TicketMessages/TicketDraftContext"
import { AUTH_UNAUTHORIZED_EVENT } from "@/services/apiClient"

export default function AppLayout() {
    const detailMatch = useMatch("/tickets/:ticketId")
    const navigate = useNavigate()
    const location = useLocation()
    const queryClient = useQueryClient()

    useEffect(() => {
        const handleUnauthorized = () => {
            queryClient.clear()
            navigate("/login", { replace: true, state: { from: location } })
        }

        window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
        return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    }, [location, navigate, queryClient])

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
            <Toaster>
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
                        </Toaster>
        </TooltipProvider>
    )
}