import { createContext, useContext, useState, type ReactNode } from "react"
import type { TicketPriority, TicketStatus } from "@/types/ticket"

export interface TicketDraft {
	subject?: string
	status?: TicketStatus
	priority?: TicketPriority
	requesterId?: number
	assigneeId?: number | null
}

interface TicketDraftContextValue {
	draft: TicketDraft
	updateDraft: (changes: Partial<TicketDraft>) => void
	resetDraft: () => void
}

const TicketDraftContext = createContext<TicketDraftContextValue | null>(null)

export function TicketDraftProvider({ children }: { children: ReactNode }) {
	const [draft, setDraft] = useState<TicketDraft>({})

	function updateDraft(changes: Partial<TicketDraft>) {
		setDraft((current) => ({ ...current, ...changes }))
	}

	function resetDraft() {
		setDraft({})
	}

	return (
		<TicketDraftContext.Provider value={{ draft, updateDraft, resetDraft }}>
			{children}
		</TicketDraftContext.Provider>
	)
}

export function useTicketDraft() {
	const context = useContext(TicketDraftContext)

	if (!context) {
		throw new Error("useTicketDraft must be used within a TicketDraftProvider.")
	}

	return context
}
