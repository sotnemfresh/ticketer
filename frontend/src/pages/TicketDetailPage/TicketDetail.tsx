import { useParams } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { diffChanges } from "@/helpers/diffChanges"
import { useCreateMessage, useTicketMessages } from "@/services/ticketMessageService"
import { useTicket } from "@/services/ticketService"
import type { Ticket } from "@/types/ticket"
import type { TicketMessage } from "@/types/ticketMessage"
import { TicketComposer } from "../../components/tickets/ticketDetailPage/TicketMessages/TicketComposer"
import { useTicketDraft, TicketDraftProvider } from "../../components/tickets/ticketDetailPage/TicketMessages/TicketDraftContext"
import { TicketHeader } from "../../components/tickets/ticketDetailPage/TicketMessages/TicketHeader"
import { TicketMessageList } from "../../components/tickets/ticketDetailPage/TicketMessages/TicketMessageList"

export default function TicketDetail() {
	const { ticketId = "" } = useParams()
	const ticketQuery = useTicket(ticketId)
	const messagesQuery = useTicketMessages(ticketId)
	const createMessage = useCreateMessage()

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
		<TicketDraftProvider key={ticketId}>
			<TicketDetailContent
				ticket={ticketQuery.data}
				messages={messagesQuery.data ?? []}
				messagesLoading={messagesQuery.isPending}
				messagesError={messagesQuery.error}
				createMessage={(body) =>
					createMessage.mutateAsync({ ticketId: ticketQuery.data.id, body })
				}
			/>
		</TicketDraftProvider>
	)
}

interface TicketDetailContentProps {
	ticket: Ticket
	messages: TicketMessage[]
	messagesLoading: boolean
	messagesError: unknown
	createMessage: (body: string) => Promise<unknown>
}

function TicketDetailContent({
	ticket,
	messages,
	messagesLoading,
	messagesError,
	createMessage,
}: TicketDetailContentProps) {
	const { draft, updateDraft, resetDraft } = useTicketDraft()
	const subject = draft.subject ?? ticket.subject
	const status = draft.status ?? ticket.status

	async function handleSubmit(body: string, submitStatus: typeof ticket.status) {
		const original = {
			subject: ticket.subject,
			status: ticket.status,
			priority: ticket.priority,
			requesterId: ticket.requester?.id,
			assigneeId: ticket.assignee?.id,
		}
		const updated = { ...original, ...draft, status: submitStatus }
		const changes = diffChanges(original, updated)

		if (Object.keys(changes).length > 0) {
			throw new Error(
				"Ticket edits are staged, but saving them with a message is not connected yet.",
			)
		}

		await createMessage(body)
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
				status={status}
				onStatusChange={(value) => updateDraft({ status: value })}
				onSubmit={handleSubmit}
			/>
		</section>
	)
}
