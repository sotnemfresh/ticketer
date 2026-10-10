import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"
import { AppSidebar } from "./app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function AppLayout() {
    return (
        <TooltipProvider>
            <div className="flex h-svh flex-col overflow-hidden bg-background">
                <Navbar />

                <div className="flex min-h-0 flex-1">
                    <SidebarProvider className="min-h-0 flex-1">
                        <AppSidebar />

                        <main className="min-w-0 flex-1 overflow-auto">
                            <Outlet />
                        </main>
                    </SidebarProvider>
                </div>
            </div>
        </TooltipProvider>
    )
}