import { useState, type SubmitEvent } from "react"
import type { Ticket } from "@/types/ticket"
import { TicketReplyRecipients } from "./TicketReplyRecipients"
import { EditorContent } from "@tiptap/react"
import { useTicketEditor } from "./useTicketEditor"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { cn } from "@/lib/utils"
import { TicketReplyModeSelect, type ReplyMode } from "./TicketReplyModeSelect"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TicketStatus } from "@/types/ticket"
import type { TicketMessageDraft } from "@/types/ticketMessage"
import { TicketEditorToolbar } from "./TicketEditorToolbar"

const ticketStatuses: TicketStatus[] = ["open", "new", "pending", "on-hold", "solved", "closed"]

const statusLabels: Record<TicketStatus, string> = {
	open: "Open",
	new: "New",
	pending: "Pending",
	"on-hold": "On-Hold",
	solved: "Solved",
	closed: "Closed",
}

interface TicketComposerProps {
	ticket: Ticket
	initialStatus: TicketStatus
	onSubmit: (message: TicketMessageDraft | undefined, status: TicketStatus) => void | Promise<void>
	isSubmitting?: boolean
	showSubmitError?: boolean
}

export function TicketComposer({
	ticket,
	initialStatus,
	onSubmit,
	isSubmitting = false,
	showSubmitError = true,
}: TicketComposerProps) {
	const [status, setStatus] = useState(initialStatus)
	const [error, setError] = useState<string | null>(null)
	const [messageType, setMessageType] = useState<ReplyMode>("INTERNAL_NOTE")
	const editor = useTicketEditor(isSubmitting)

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!editor || isSubmitting) return
		const bodyText = editor.getText().trim()
		const message: TicketMessageDraft | undefined = !editor.isEmpty && bodyText
			? { bodyText, bodyHtml: editor.getHTML(), type: messageType }
			: undefined
		setError(null)

		try {
			await onSubmit(message, status)
			editor.commands.clearContent()
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
			{messageType === "OUTBOUND" ? (
				<TicketReplyRecipients ticket={ticket} disabled={isSubmitting}>
					<TicketReplyModeSelect
						value={messageType}
						onChange={setMessageType}
						disabled={isSubmitting}
					/>
				</TicketReplyRecipients>
			) : (
				<TicketReplyModeSelect
					value={messageType}
					onChange={setMessageType}
					disabled={isSubmitting}
				/>
			)}
			<div className={cn(
				"overflow-hidden rounded-md border text-foreground",
				messageType === "INTERNAL_NOTE"
					? "border-yellow-200 bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-950"
					: "border-border bg-background",
			)}>
				<div className="max-h-64 overflow-y-auto">
					<EditorContent editor={editor} />
				</div>
				<TicketEditorToolbar editor={editor} disabled={isSubmitting} />
			</div>
			<div className="flex items-center justify-between gap-3">
				{showSubmitError && (
					<p aria-live="polite" className="min-h-5 text-sm text-destructive">
						{error}
					</p>
				)}
				<ButtonGroup className="ml-auto shrink-0">
					<Button type="submit" disabled={isSubmitting || !editor}>
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
										setStatus(value as TicketStatus)
									}
								}}
							>
								{ticketStatuses.map((ticketStatus) => (
									<DropdownMenuRadioItem
										key={ticketStatus}
										value={ticketStatus}
										closeOnClick
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
