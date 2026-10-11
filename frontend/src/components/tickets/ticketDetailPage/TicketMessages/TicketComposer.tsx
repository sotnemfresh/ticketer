import { useState, type SubmitEvent } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import type { TicketStatus } from "@/types/ticket"

const ticketStatuses: TicketStatus[] = ["open", "new", "pending", "solved", "closed"]

const statusLabels: Record<TicketStatus, string> = {
	open: "Open",
	new: "New",
	pending: "Pending",
	solved: "Solved",
	closed: "Closed",
}

interface TicketComposerProps {
	status: TicketStatus
	onStatusChange: (status: TicketStatus) => void
	onSubmit: (body: string, status: TicketStatus) => void | Promise<void>
	isSubmitting?: boolean
}

export function TicketComposer({
	status,
	onStatusChange,
	onSubmit,
	isSubmitting = false,
}: TicketComposerProps) {
	const [body, setBody] = useState("")
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault()
		const message = body.trim()

		if (!message) {
			setError("Write a message before submitting.")
			return
		}

		setError(null)

		try {
			await onSubmit(message, status)
			setBody("")
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: "The message could not be sent.",
			)
		}
	}

	return (
		<form className="shrink-0 space-y-3 border-t p-4" onSubmit={handleSubmit}>
			<Textarea
				aria-label="Write a ticket message"
				aria-invalid={Boolean(error)}
				className="max-h-48 min-h-24 resize-y"
				disabled={isSubmitting}
				onChange={(event) => {
					setBody(event.target.value)
					if (error) setError(null)
				}}
				placeholder="Write a message..."
				value={body}
			/>
			<div className="flex items-center justify-between gap-3">
				<p aria-live="polite" className="min-h-5 text-sm text-destructive">
					{error}
				</p>
				<ButtonGroup className="shrink-0">
					<Button type="submit" disabled={isSubmitting || !body.trim()}>
						{isSubmitting ? "Submitting..." : `Submit as ${statusLabels[status]}`}
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									type="button"
									variant="default"
									size="icon"
									aria-label="Choose submit status"
									disabled={isSubmitting}
								>
									<ChevronDown />
								</Button>
							}
						/>
						<DropdownMenuContent align="end">
							<DropdownMenuRadioGroup
								value={status}
								onValueChange={(value) => {
									if (ticketStatuses.includes(value as TicketStatus)) {
										onStatusChange(value as TicketStatus)
									}
								}}
							>
								{ticketStatuses.map((ticketStatus) => (
									<DropdownMenuRadioItem
										key={ticketStatus}
										value={ticketStatus}
									>
										{statusLabels[ticketStatus]}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</ButtonGroup>
			</div>
		</form>
	)
}
