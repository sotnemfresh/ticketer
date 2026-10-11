import { useParams } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { diffChanges } from "@/helpers/diffChanges"
import { useCreateMessage, useTicketMessages } from "@/services/ticketMessageService"
import { useTicket, useUpdateTicket } from "@/services/ticketService"
import type { Ticket, TicketPriority, TicketStatus } from "@/types/ticket"
import type { TicketMessage } from "@/types/ticketMessage"
import { TicketComposer } from "../../components/tickets/ticketDetailPage/TicketMessages/TicketComposer"
import { useTicketDraft } from "../../components/tickets/ticketDetailPage/TicketMessages/TicketDraftContext"
import { TicketHeader } from "../../components/tickets/ticketDetailPage/TicketMessages/TicketHeader"
import { TicketMessageList } from "../../components/tickets/ticketDetailPage/TicketMessages/TicketMessageList"

export default function TicketDetail() {
	const { ticketId = "" } = useParams()
	const ticketQuery = useTicket(ticketId)
	const messagesQuery = useTicketMessages(ticketId)
	const createMessage = useCreateMessage()
	const updateTicket = useUpdateTicket()

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
			isSubmitting={createMessage.isPending || updateTicket.isPending}
			updateTicket={(changes) => updateTicket.mutateAsync(changes)}
			createMessage={(body) =>
				createMessage.mutateAsync({ ticketId: ticketQuery.data.id, body })
			}
		/>
	)
}

interface TicketDetailContentProps {
	ticket: Ticket
	messages: TicketMessage[]
	messagesLoading: boolean
	messagesError: unknown
	createMessage: (body: string) => Promise<unknown>
	updateTicket: (changes: {
		ticketId: number
		status?: TicketStatus
		priority?: TicketPriority
		assigneeId?: number | null
		requesterId?: number
	}) => Promise<unknown>
	isSubmitting: boolean
}

function TicketDetailContent({
	ticket,
	messages,
	messagesLoading,
	messagesError,
	isSubmitting,
	updateTicket,
	createMessage,
}: TicketDetailContentProps) {
	const { draft, updateDraft, resetDraft } = useTicketDraft()
	const subject = draft.subject ?? ticket.subject
	const currentStatus = ticket.status.toLowerCase()
	const status = (
		["open", "new", "pending", "closed", "solved"].includes(currentStatus)
			? currentStatus as TicketStatus
			: "open"
	)
	const currentPriority = ticket.priority.toLowerCase() as TicketPriority

	async function handleSubmit(body: string, submitStatus: typeof ticket.status) {
		const original = {
			subject: ticket.subject,
			status,
			priority: currentPriority,
			requesterId: ticket.requester?.id,
			assigneeId: ticket.assignee?.id,
		}
		const updated = { ...original, ...draft, status: submitStatus }
		const changes = diffChanges(original, updated)

		if (changes.subject !== undefined) {
			throw new Error(
				"Subject edits cannot be saved until the backend accepts subject updates.",
			)
		}

		const { subject: _subject, ...ticketChanges } = changes
		const hasTicketChanges = Object.keys(ticketChanges).length > 0
		const hasMessage = body.trim().length > 0

		if (!hasTicketChanges && !hasMessage) {
			throw new Error("Make a ticket change or write a message before submitting.")
		}
		if (hasTicketChanges) {
			await updateTicket({
				ticketId: ticket.id,
				...ticketChanges,
			})
		}
		if (hasMessage) {
			await createMessage(body.trim())
		}
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
			/>
		</section>
	)
}
