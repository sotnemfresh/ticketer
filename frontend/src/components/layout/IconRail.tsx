import { Ticket } from "lucide-react"
import { NavLink, useMatch } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"

export function IconRail() {
	const isTicketList = Boolean(useMatch({ path: "/tickets", end: true }))

	return (
		<nav
			aria-label="Primary navigation"
			className="flex w-12 shrink-0 flex-col items-center border-r bg-background py-3"
		>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							render={<NavLink to="/tickets" end />}
							nativeButton={false}
							variant={isTicketList ? "secondary" : "ghost"}
							size="icon"
							aria-label="Ticket list"
							aria-current={isTicketList ? "page" : undefined}
						>
							<Ticket />
						</Button>
					}
				/>
				<TooltipContent side="right">Tickets</TooltipContent>
			</Tooltip>
		</nav>
	)
}
