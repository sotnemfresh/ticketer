import { useEffect, useState, type SubmitEvent } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CreateTicketData } from "@/services/ticketService"
import type { User } from "@/types/user"

interface TicketCreationProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    users: User[]
    currentUserId?: number
    isLoadingUsers: boolean
    usersError: boolean
    onRetryUsers: () => void
    isCreating: boolean
    onCreate: (data: CreateTicketData) => Promise<void>
}

type AssigneeOption = User | { id: null; name: "Unassigned" }

const unassignedAssignee = { id: null, name: "Unassigned" } as const
const priorityItems = [
    { label: "Low", value: "low" },
    { label: "Medium", value: "medium" },
    { label: "High", value: "high" },
    { label: "Urgent", value: "urgent" },
] as const

export function TicketCreation({
    open,
    onOpenChange,
    users,
    currentUserId,
    isLoadingUsers,
    usersError,
    onRetryUsers,
    isCreating,
    onCreate,
}: TicketCreationProps) {
    const [subject, setSubject] = useState("")
    const [requesterId, setRequesterId] = useState<number | null>(null)
    const [assigneeId, setAssigneeId] = useState<number | null>(null)
    const [priority, setPriority] = useState<CreateTicketData["priority"]>("medium")
    const [requesterError, setRequesterError] = useState(false)
    const requester = users.find((user) => user.id === requesterId) ?? null
    const assigneeOptions: AssigneeOption[] = [unassignedAssignee, ...users]
    const assignee = assigneeId === null
        ? unassignedAssignee
        : users.find((user) => user.id === assigneeId) ?? unassignedAssignee

    useEffect(() => {
        if (requesterId === null && currentUserId !== undefined) {
            setRequesterId(currentUserId)
        }
    }, [currentUserId, requesterId])

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault()
        if (requesterId === null) {
            setRequesterError(true)
            return
        }

        setRequesterError(false)
        try {
            await onCreate({
                subject: subject.trim(),
                priority,
                requesterId,
                assigneeId,
            })
            setSubject("")
            setAssigneeId(null)
            setPriority("medium")
            onOpenChange(false)
        } catch {
            // The container reports request errors through the app toast.
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger render={<Button type="button" variant="outline"><Plus />New ticket</Button>} />
            <DialogContent className="sm:max-w-lg">
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create ticket</DialogTitle>
                        <DialogDescription>Choose a requester, an optional assignee, and the ticket priority.</DialogDescription>
                    </DialogHeader>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="ticket-subject">Subject</FieldLabel>
                            <Input id="ticket-subject" autoFocus required maxLength={200} value={subject} onChange={(event) => setSubject(event.target.value)} />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="ticket-requester">Requester</FieldLabel>
                            <Combobox<User>
                                items={users}
                                value={requester}
                                onValueChange={(user) => {
                                    setRequesterId(user?.id ?? null)
                                    setRequesterError(false)
                                }}
                                itemToStringLabel={(user) => user.name}
                                itemToStringValue={(user) => String(user.id)}
                            >
                                <ComboboxInput id="ticket-requester" className="w-full" placeholder={isLoadingUsers ? "Loading users..." : "Search users"} disabled={isLoadingUsers || usersError} />
                                <ComboboxContent>
                                    <ComboboxEmpty>{isLoadingUsers ? "Loading users..." : "No users found."}</ComboboxEmpty>
                                    <ComboboxList>
                                        {users.map((user) => <ComboboxItem key={user.id} value={user}>{user.name}</ComboboxItem>)}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                            {requesterError && <p className="text-sm text-destructive">Choose a requester.</p>}
                            {usersError && (
                                <div role="alert" className="flex items-center justify-between gap-3 text-sm text-destructive">
                                    <span>Could not load users.</span>
                                    <Button type="button" variant="outline" size="sm" onClick={onRetryUsers}>Retry</Button>
                                </div>
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="ticket-assignee">Assignee</FieldLabel>
                            <Combobox<AssigneeOption>
                                items={assigneeOptions}
                                value={assignee}
                                onValueChange={(option) => setAssigneeId(option?.id ?? null)}
                                itemToStringLabel={(option) => option.name}
                                itemToStringValue={(option) => option.id === null ? "unassigned" : String(option.id)}
                            >
                                <ComboboxInput id="ticket-assignee" className="w-full" placeholder={isLoadingUsers ? "Loading users..." : "Search users or leave unassigned"} disabled={isLoadingUsers || usersError} showClear />
                                <ComboboxContent>
                                    <ComboboxEmpty>{isLoadingUsers ? "Loading users..." : "No users found."}</ComboboxEmpty>
                                    <ComboboxList>
                                        <ComboboxItem value={unassignedAssignee}>Unassigned</ComboboxItem>
                                        {users.map((user) => <ComboboxItem key={user.id} value={user}>{user.name}</ComboboxItem>)}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="ticket-priority">Priority</FieldLabel>
                            <Select
                                items={priorityItems}
                                value={priority}
                                onValueChange={(value) => {
                                    if (priorityItems.some((item) => item.value === value)) {
                                        setPriority(value as CreateTicketData["priority"])
                                    }
                                }}
                            >
                                <SelectTrigger id="ticket-priority" className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {priorityItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>
                    </FieldGroup>
                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={isCreating} onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isCreating || isLoadingUsers || usersError || users.length === 0}>
                            {isCreating ? "Creating..." : "Create ticket"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
