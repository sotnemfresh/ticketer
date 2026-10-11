import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Message, MessageAvatar, MessageContent, MessageHeader } from "@/components/ui/message"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import type { TicketMessage } from "@/types/ticketMessage"

interface TicketMessageListProps {
    messages: TicketMessage[]
    isLoading?: boolean
}

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
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
                    messages.map((message) => {
                        const authorName = message.authorName?.trim() || "Unknown author"

                        return (
                            <li key={message.id} className="flex gap-3">
                                <Message>
                                    <MessageAvatar>
                                        <Avatar className="mt-0.5">
                                            <AvatarFallback>{getInitials(authorName) || "?"}</AvatarFallback>
                                        </Avatar>
                                    </MessageAvatar>
                                    <MessageContent>
                                        <MessageHeader className="gap-2">
                                            <h2 className="text-sm font-semibold">{authorName}</h2>
                                            <time
                                                className="text-xs text-muted-foreground"
                                                dateTime={message.createdAt}
                                            >
                                                {new Date(message.createdAt).toLocaleString()}
                                            </time>
                                        </MessageHeader>
                                        <Bubble>
                                            <BubbleContent>
                                                {message.body}
                                            </BubbleContent>
                                        </Bubble>
                                    </MessageContent>
                                </Message>
                            </li>
                        )
                    })
                )}
            </ol>
        </ScrollArea>
    )
}