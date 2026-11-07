import { TicketStatusBadge } from "../TicketStatusBadge"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import type { Ticket, TicketPriority } from "@/types/ticket"
import type { User } from "@/types/user"
import { SidebarCombobox } from "@/components/tickets/ticketDetailPage/SidebarCombobox"

type AssigneeOption = Pick<User, "name" | "email"> & { id: number | null }

const unassignedOption: AssigneeOption = { id: null, name: "Unassigned", email: "" }
const priorityOptions: { label: string; value: TicketPriority }[] = [
    { label: "Low", value: "low" },
    { label: "Medium", value: "medium" },
    { label: "High", value: "high" },
    { label: "Urgent", value: "urgent" },
]

function filterUser(user: Pick<User, "name" | "email">, query: string) {
    const search = query.trim().toLowerCase()
    return user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search)
}

function UserOptionLabel({ name, email }: Pick<User, "name" | "email">) {
    return (
        <div className="min-w-0 py-0.5">
            <div className="wrap-break-word text-sm font-medium">{name}</div>
            {email && <div className="break-all text-xs text-muted-foreground">{email}</div>}
        </div>
    )
}

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
    const requester = users.find((user) => user.id === requesterId) ?? null
    const assigneeOptions: AssigneeOption[] = [
        unassignedOption,
        ...users.filter((user) => user.role.toLowerCase() !== "customer"),
    ]
    const assignee = assigneeOptions.find((user) => user.id === assigneeId) ?? null

    return (
        <Field>
            <div className="flex items-center gap-2 pb-2">
                <TicketStatusBadge status={ticket.status} />
                <span className="text-sm font-medium">Ticket #{ticket.id}</span>
            </div>
            <SidebarCombobox<User>
                id="sidebar-requester"
                label="Requester"
                items={users}
                value={requester}
                onValueChange={(user) => {
                    if (user !== null) onRequesterChange(user.id)
                }}
                getLabel={(user) => user.name}
                getKey={(user) => String(user.id)}
                filter={filterUser}
                placeholder="Search name or email"
                emptyMessage="No users found."
                renderItem={(user) => <UserOptionLabel name={user.name} email={user.email} />}
                description={requester?.email}
                footer={
                    <Button type="button" variant="ghost" size="sm" className="w-full justify-start" disabled>
                        <UserPlus />
                        Add user
                    </Button>
                }
            />

            <SidebarCombobox<AssigneeOption>
                id="sidebar-assignee"
                label="Assignee"
                items={assigneeOptions}
                value={assignee}
                onValueChange={(user) => onAssigneeChange(user?.id ?? null)}
                getLabel={(user) => user.name}
                getKey={(user) => user.id === null ? "unassigned" : String(user.id)}
                filter={filterUser}
                placeholder="Search name or email"
                emptyMessage="No users found."
                renderItem={(user) => <UserOptionLabel name={user.name} email={user.email} />}
                showClear
            />
            <Separator />

            <SidebarCombobox<(typeof priorityOptions)[number]>
                id="sidebar-priority"
                label="Priority"
                items={priorityOptions}
                value={priorityOptions.find((option) => option.value === priority) ?? null}
                getLabel={(option) => option.label}
                getKey={(option) => option.value}
                onValueChange={(option) => {
                    if (option !== null) onPriorityChange(option.value)
                }}
                placeholder="Search priority"
                emptyMessage="No priorities found."
            />

        </Field>
    )
}