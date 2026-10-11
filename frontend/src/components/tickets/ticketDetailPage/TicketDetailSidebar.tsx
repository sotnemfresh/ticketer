import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { Ticket } from "@/types/ticket"
import type { User } from "@/types/user"

interface TicketDetailSidebarProps {
    ticket: Ticket
    users: User[]
}

export default function TicketDetailSidebar({ ticket, users }: TicketDetailSidebarProps) {
    const items = users.map((user) => ({ label: user.name, value: String(user.id) }))

    return (
        <Field>
            <FieldLabel>
                Requester
            </FieldLabel>
            <Select
                items={items}
                value={ticket.requester ? String(ticket.requester.id) : null}
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
                items={items}
                value={ticket.assignee ? String(ticket.assignee.id) : null}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Assignee" />
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
            <Separator />

            <FieldLabel>
                Priority
            </FieldLabel>
            <Select
                items={[
                    { label: "Low", value: "low" },
                    { label: "Medium", value: "medium" },
                    { label: "High", value: "high" },
                ]}
                value={ticket.priority ?? null}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>

        </Field>
    )
}