import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import type { TicketMessage } from "@/types/ticketMessage"
import { TicketMessageBody } from "./TicketMessageBody"

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
}

export function TicketMessageItem({ message }: { message: TicketMessage }) {
    const name = message.authorName?.trim() || message.authorEmail || "Unknown author"
    const labels = { INBOUND: "Incoming email", OUTBOUND: "Public reply", INTERNAL_NOTE: "Internal note" }

    return (
        <Card className={`w-full min-w-0 rounded-md ${message.type === "INTERNAL_NOTE" ? "bg-yellow-100 ring-yellow-200 dark:bg-yellow-950 dark:ring-yellow-800" : ""}`}>
            <CardHeader className="flex flex-row items-start gap-3">
                <Avatar className="shrink-0"><AvatarFallback>{getInitials(name) || "?"}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                    <h2 className="break-words text-sm font-semibold">{name}</h2>
                    {message.authorEmail && <p className="break-all text-xs text-muted-foreground">{message.authorEmail}</p>}
                    <p className="text-xs text-muted-foreground">{labels[message.type]}</p>
                    <time dateTime={message.createdAt} className="text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</time>
                </div>
            </CardHeader>
            <CardContent className="min-w-0"><TicketMessageBody bodyHtml={message.bodyHtml} bodyText={message.bodyText} /></CardContent>
        </Card>
    )
}