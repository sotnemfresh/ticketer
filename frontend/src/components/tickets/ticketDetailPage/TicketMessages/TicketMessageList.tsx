import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import type { TicketMessage } from "@/types/ticketMessage"
import { TicketMessageItem } from "./TicketMessageItem"

interface TicketMessageListProps {
    messages: TicketMessage[]
    isLoading?: boolean
}



export function TicketMessageList({
    messages,
    isLoading = false,
}: TicketMessageListProps) {
    return (
        <ScrollArea
            aria-label="Ticket messages"
            className="h-full min-h-0 flex-1"
        >
            <ol aria-live="polite" className="space-y-6 px-4 py-5">
                {isLoading ? (
                    Array.from({ length: 3 }, (_, index) => (
                        <li key={index} className="flex gap-3">
                            <Skeleton className="size-8 shrink-0 rounded-full" />
                            <div className="flex flex-1 flex-col gap-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        </li>
                    ))
                ) : messages.length === 0 ? (
                    <li className="py-10 text-center text-sm text-muted-foreground">
                        No messages yet.
                    </li>
                ) : (
                    messages.map((message) => (
                        <li key={message.id}><TicketMessageItem message={message} /></li>
                    ))
                )}
            </ol>
        </ScrollArea>
    )
}