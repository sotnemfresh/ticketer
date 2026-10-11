import { TicketStatusBadge } from "../TicketStatusBadge"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { Ticket, TicketPriority } from "@/types/ticket"
import type { User } from "@/types/user"

interface TicketDetailSidebarProps {
    ticket: Ticket
    users: User[]
    priority: TicketPriority
    requesterId?: number
    assigneeId: number | null
    onRequesterChange: (requesterId: number) => void
    onAssigneeChange: (assigneeId: number | null) => void
    onPriorityChange: (priority: TicketPriority) => void
}

export default function TicketDetailSidebar({
    ticket,
    users,
    priority,
    requesterId,
    assigneeId,
    onRequesterChange,
    onAssigneeChange,
    onPriorityChange,
}: TicketDetailSidebarProps) {
    const items = users.map((user) => ({ label: user.name, value: String(user.id) }))
    const assigneeItems = [{ label: "Unassigned", value: "unassigned" }, ...items]

    return (
        <Field>
            <div className="flex items-center gap-2 pb-2">
                <TicketStatusBadge status={ticket.status} />
                <span className="text-sm font-medium">Ticket #{ticket.id}</span>
            </div>
            <FieldLabel>
                Requester
            </FieldLabel>
            <Select
                items={items}
                value={requesterId == null ? null : String(requesterId)}
                onValueChange={(value) => {
                    if (value !== null) onRequesterChange(Number(value))
                }}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Requester" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {items.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>

            <FieldLabel>
                Assignee
            </FieldLabel>
            <Select
                items={assigneeItems}
                value={assigneeId === null ? "unassigned" : String(assigneeId)}
                onValueChange={(value) => {
                    onAssigneeChange(value === null || value === "unassigned" ? null : Number(value))
                }}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {assigneeItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            <Separator />

            <FieldLabel>
                Priority
            </FieldLabel>
            <Select
                items={[
                    { label: "Low", value: "low" },
                    { label: "Medium", value: "medium" },
                    { label: "High", value: "high" },
                    { label: "Urgent", value: "urgent" },
                ]}
                value={priority}
                onValueChange={(value) => {
                    if (value !== null) onPriorityChange(value as TicketPriority)
                }}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>

        </Field>
    )
}