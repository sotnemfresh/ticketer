import { History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TicketHeaderProps {
	subject: string
	onSubjectChange: (subject: string) => void
	onHistoryClick?: () => void
}

export function TicketHeader({
	subject,
	onSubjectChange,
	onHistoryClick,
}: TicketHeaderProps) {
	return (
		<header className="flex min-w-0 items-center gap-3 border-b px-4 py-3">
			<Input
				aria-label="Ticket subject"
				className="h-10 min-w-0 border-transparent bg-transparent px-2 text-lg font-semibold shadow-none hover:border-input focus-visible:border-input"
				value={subject}
				onChange={(event) => onSubjectChange(event.target.value)}
			/>
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={!onHistoryClick}
				onClick={onHistoryClick}
			>
				<History />
				History
			</Button>
		</header>
	)
}
