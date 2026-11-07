import { TicketStatusBadge } from "../TicketStatusBadge"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Separator } from "@/components/ui/separator"
import type { Ticket, TicketPriority } from "@/types/ticket"
import type { User } from "@/types/user"

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
            <FieldLabel htmlFor="sidebar-requester">
                Requester
            </FieldLabel>
            <Combobox<User>
                items={users}
                value={requester}
                onValueChange={(user) => {
                    if (user !== null) onRequesterChange(user.id)
                }}
                itemToStringLabel={(user) => user.name}
                itemToStringValue={(user) => String(user.id)}
                isItemEqualToValue={(user, value) => user.id === value.id}
                filter={filterUser}
            >
                <ComboboxInput id="sidebar-requester" className="w-full" placeholder="Search name or email" />
                <ComboboxContent>
                    <ComboboxEmpty>No users found.</ComboboxEmpty>
                    <ComboboxList>
                        {(user: User) => (
                            <ComboboxItem key={user.id} value={user}>
                                <UserOptionLabel name={user.name} email={user.email} />
                            </ComboboxItem>
                        )}
                    </ComboboxList>
                    <div className="border-t p-1">
                        <Button type="button" variant="ghost" size="sm" className="w-full justify-start" disabled>
                            <UserPlus />
                            Add user
                        </Button>
                    </div>
                </ComboboxContent>
            </Combobox>
            {requester && <p className="break-all text-xs text-muted-foreground">{requester.email}</p>}

            <FieldLabel htmlFor="sidebar-assignee">
                Assignee
            </FieldLabel>
            <Combobox<AssigneeOption>
                items={assigneeOptions}
                value={assignee}
                onValueChange={(user) => onAssigneeChange(user?.id ?? null)}
                itemToStringLabel={(user) => user.name}
                itemToStringValue={(user) => user.id === null ? "unassigned" : String(user.id)}
                isItemEqualToValue={(user, value) => user.id === value.id}
                filter={filterUser}
            >
                <ComboboxInput id="sidebar-assignee" className="w-full" placeholder="Search name or email" showClear />
                <ComboboxContent>
                    <ComboboxEmpty>No users found.</ComboboxEmpty>
                    <ComboboxList>
                        {(user: AssigneeOption) => (
                            <ComboboxItem key={user.id ?? "unassigned"} value={user}>
                                <UserOptionLabel name={user.name} email={user.email} />
                            </ComboboxItem>
                        )}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
            <Separator />

            <FieldLabel htmlFor="sidebar-priority">
                Priority
            </FieldLabel>
            <Combobox<(typeof priorityOptions)[number]>
                items={priorityOptions}
                value={priorityOptions.find((option) => option.value === priority) ?? null}
                itemToStringLabel={(option) => option.label}
                itemToStringValue={(option) => option.value}
                onValueChange={(option) => {
                    if (option !== null) onPriorityChange(option.value)
                }}
            >
                <ComboboxInput id="sidebar-priority" className="w-full" placeholder="Search priority" />
                <ComboboxContent>
                    <ComboboxEmpty>No priorities found.</ComboboxEmpty>
                    <ComboboxList>
                        {(option: (typeof priorityOptions)[number]) => (
                            <ComboboxItem key={option.value} value={option}>{option.label}</ComboboxItem>
                        )}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>

        </Field>
    )
}