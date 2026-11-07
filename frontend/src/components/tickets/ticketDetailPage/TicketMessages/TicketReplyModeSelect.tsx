import { Mail, StickyNote } from "lucide-react"
import {
    Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"

export type ReplyMode = "INTERNAL_NOTE" | "OUTBOUND"

interface TicketReplyModeSelectProps {
    value: ReplyMode
    onChange: (value: ReplyMode) => void
    disabled?: boolean
}

export function TicketReplyModeSelect({
    value, onChange, disabled,
}: TicketReplyModeSelectProps) {
    const internal = value === "INTERNAL_NOTE"

    return (
        <Select value={value} disabled={disabled} onValueChange={(next) => {
            if (next === "INTERNAL_NOTE" || next === "OUTBOUND") onChange(next)
        }}>
            <SelectTrigger size="sm" aria-label="Reply visibility">
                {internal ? <StickyNote /> : <Mail />}
                <SelectValue>{internal ? "Internal note" : "Public reply"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="INTERNAL_NOTE">Internal note</SelectItem>
                <SelectItem value="OUTBOUND">Public reply</SelectItem>
            </SelectContent>
        </Select>
    )
}