import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { diffChanges } from "@/helpers/diffChanges"
import { useSubmitTicketUpdate, useTicketMessages } from "@/services/ticketMessageService"
import { useTicket } from "@/services/ticketService"
import type { Ticket, TicketPriority, TicketStatus, TicketUpdateChanges } from "@/types/ticket"
import type { TicketMessage } from "@/types/ticketMessage"
import { TicketComposer } from "../../components/tickets/ticketDetailPage/TicketMessages/TicketComposer"
import { useTicketDraft } from "../../components/tickets/ticketDetailPage/TicketMessages/TicketDraftContext"
import { TicketHeader } from "../../components/tickets/ticketDetailPage/TicketMessages/TicketHeader"
import { TicketMessageList } from "../../components/tickets/ticketDetailPage/TicketMessages/TicketMessageList"

export default function TicketDetail() {
	const { ticketId = "" } = useParams()
	const ticketQuery = useTicket(ticketId)
	const messagesQuery = useTicketMessages(ticketId)
	const submitTicketUpdate = useSubmitTicketUpdate()

	useEffect(() => {
		if (!ticketQuery.error) return

		toast.add({
			id: `ticket-load-${ticketId}`,
			title: "Could not load ticket",
			description: ticketQuery.error instanceof Error
				? ticketQuery.error.message
				: "The ticket request failed.",
			type: "error",
		})
	}, [ticketId, ticketQuery.error])

	if (ticketQuery.isPending) {
		return (
			<section className="flex h-full min-h-0 flex-col gap-4 p-4">
				<Skeleton className="h-12 w-full" />
				<Skeleton className="min-h-0 flex-1" />
				<Skeleton className="h-32 w-full" />
			</section>
		)
	}

	if (ticketQuery.error || !ticketQuery.data) {
		return (
			<p role="alert" className="p-4 text-sm text-destructive">
				{ticketQuery.error instanceof Error
					? ticketQuery.error.message
					: "Ticket not found."}
			</p>
		)
	}

	return (
		<TicketDetailContent
			ticket={ticketQuery.data}
			messages={messagesQuery.data ?? []}
			messagesLoading={messagesQuery.isPending}
			messagesError={messagesQuery.error}
			isSubmitting={submitTicketUpdate.isPending}
			submitUpdate={(data) => submitTicketUpdate.mutateAsync(data)}
		/>
	)
}

interface TicketDetailContentProps {
	ticket: Ticket
	messages: TicketMessage[]
	messagesLoading: boolean
	messagesError: unknown
	submitUpdate: (data: {
		ticketId: number
		changes?: TicketUpdateChanges
		message?: string
	}) => Promise<unknown>
	isSubmitting: boolean
}

function TicketDetailContent({
	ticket,
	messages,
	messagesLoading,
	messagesError,
	isSubmitting,
	submitUpdate,
}: TicketDetailContentProps) {
	const { draft, updateDraft, resetDraft } = useTicketDraft()
	const subject = draft.subject ?? ticket.subject
	const currentStatus = ticket.status.toLowerCase().replaceAll("_", "-")
	const status = (
		["open", "new", "pending", "on-hold", "closed", "solved"].includes(currentStatus)
			? currentStatus as TicketStatus
			: "open"
	)
	const currentPriority = ticket.priority.toLowerCase() as TicketPriority

	useEffect(() => {
		if (!messagesError) return

		toast.add({
			id: `ticket-messages-${ticket.id}`,
			title: "Could not load messages",
			description: messagesError instanceof Error
				? messagesError.message
				: "The message request failed.",
			type: "error",
		})
	}, [messagesError, ticket.id])

	async function handleSubmit(body: string, submitStatus: TicketStatus) {
		const original = {
			subject: ticket.subject,
			status,
			priority: currentPriority,
			requesterId: ticket.requester?.id,
			assigneeId: ticket.assignee?.id,
		}
		const updated = { ...original, ...draft, status: submitStatus }
		const changes = diffChanges(original, updated)

		const hasTicketChanges = Object.keys(changes).length > 0
		const hasMessage = body.trim().length > 0

		if (!hasTicketChanges && !hasMessage) {
			const error = new Error("Make a ticket change or write a message before submitting.")
			toast.add({
				title: "Nothing to submit",
				description: error.message,
				type: "error",
			})
			throw error
		}
		const submission = submitUpdate({
			ticketId: ticket.id,
			...(hasTicketChanges ? { changes } : {}),
			...(hasMessage ? { message: body.trim() } : {}),
		})
		await toast.promise(submission, {
			loading: {
				title: "Saving ticket update",
				description: "Applying changes and sending your message...",
				type: "loading",
			},
			success: {
				title: "Ticket updated",
				description: hasMessage
					? "Your message and ticket changes were saved."
					: "Your ticket changes were saved.",
				type: "success",
			},
			error: (error) => ({
				title: "Could not update ticket",
				description: error instanceof Error
					? error.message
					: "Your changes could not be saved.",
				type: "error",
			}),
		})
		resetDraft()
	}

	return (
		<section aria-label="Ticket conversation" className="flex h-full min-h-0 flex-col overflow-hidden">
			<TicketHeader
				subject={subject}
				onSubjectChange={(value) => updateDraft({ subject: value })}
			/>
			{messagesError != null && (
				<p role="alert" className="border-b px-4 py-2 text-sm text-destructive">
					Could not load ticket messages.
				</p>
			)}
			<TicketMessageList messages={messages} isLoading={messagesLoading} />
			<TicketComposer
				key={ticket.id}
				initialStatus={status}
				onSubmit={handleSubmit}
				isSubmitting={isSubmitting}
				showSubmitError={false}
			/>
		</section>
	)
}
