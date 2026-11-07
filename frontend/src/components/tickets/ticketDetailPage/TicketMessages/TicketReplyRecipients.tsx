import { useState, type ReactNode } from "react"
import { ChevronDown, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
    Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxContent,
    ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger,
    ComboboxValue, useComboboxAnchor,
} from "@/components/ui/combobox"
import { FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { useUsers } from "@/services/userService"
import type { Ticket } from "@/types/ticket"
import type { User } from "@/types/user"
import { useTicketDraft } from "@/components/tickets/ticketDetailPage/TicketMessages/TicketDraftContext"

type RecipientUser = Pick<User, "id" | "name" | "email">
type CcOption = { name: string; email: string }

interface TicketReplyRecipientsProps {
    ticket: Ticket
    disabled?: boolean
    children?: ReactNode
}

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

function RecipientLabel({ name, email }: CcOption) {
    return (
        <div className="min-w-0 py-0.5">
            <div className="wrap-break-word text-sm font-medium">{name}</div>
            <div className="break-all text-xs text-muted-foreground">{email}</div>
        </div>
    )
}

export function TicketReplyRecipients({ ticket, disabled = false, children }: TicketReplyRecipientsProps) {
    const { draft, updateDraft } = useTicketDraft()
    const usersQuery = useUsers()
    const users = usersQuery.data ?? []
    const [expanded, setExpanded] = useState(false)
    const [toSearch, setToSearch] = useState("")
    const [ccSearch, setCcSearch] = useState("")
    const ccAnchor = useComboboxAnchor()
    const toInputId = `reply-to-${ticket.id}`
    const ccInputId = `reply-cc-${ticket.id}`

    const requesterId = draft.requesterId ?? ticket.requester?.id
    const requesterOptions: RecipientUser[] = [...users]
    if (ticket.requester && !requesterOptions.some((user) => user.id === ticket.requester?.id)) {
        requesterOptions.push(ticket.requester)
    }
    const requester = requesterOptions.find((user) => user.id === requesterId) ?? null
    const requesterEmail = normalizeEmail(requester?.email ?? "")
    const ccEmails = draft.ccEmails ?? ticket.ccRecipients?.map((recipient) => recipient.email) ?? []
    const optionsByEmail = new Map<string, CcOption>()
    for (const recipient of ticket.ccRecipients ?? []) {
        const email = normalizeEmail(recipient.email)
        if (email && email !== requesterEmail) {
            optionsByEmail.set(email, { email, name: recipient.user?.name || email })
        }
    }
    for (const user of users) {
        const email = normalizeEmail(user.email)
        if (email && email !== requesterEmail) optionsByEmail.set(email, { email, name: user.name })
    }
    const selectedEmails = [...new Set(ccEmails.map(normalizeEmail))]
        .filter((email) => email && email !== requesterEmail)
    for (const email of selectedEmails) {
        if (!optionsByEmail.has(email)) optionsByEmail.set(email, { email, name: email })
    }
    const ccOptions = [...optionsByEmail.values()]
    const selectedCc = selectedEmails.map((email) => optionsByEmail.get(email)!)
    const summary = [requester?.name || requester?.email, ...selectedCc.map((recipient) => recipient.name)]
        .filter(Boolean).join(", ") || "Select requester"

    return (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
            <div className="flex min-w-0 items-center gap-3">
                {children && <><div className="shrink-0">{children}</div><Separator orientation="vertical" className="h-5 self-center" /></>}
                <CollapsibleTrigger render={
                    <Button type="button" variant="ghost" disabled={disabled}
                        className="h-auto min-h-8 min-w-0 justify-start whitespace-normal px-1 text-left"
                        aria-label={`Edit recipients: ${summary}`}>
                        <span className="min-w-0 wrap-break-word">{summary}</span>
                        <ChevronDown className="shrink-0" />
                    </Button>
                } />
            </div>
            <CollapsibleContent>
                <div className="mt-2 space-y-2">
                    <div className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-center gap-2">
                        <FieldLabel htmlFor={toInputId}>To:</FieldLabel>
                        <Combobox<RecipientUser>
                            items={requesterOptions} value={requester} disabled={disabled}
                            itemToStringLabel={(user) => user.name} itemToStringValue={(user) => String(user.id)}
                            isItemEqualToValue={(user, value) => user.id === value.id}
                            filter={(user, query) => `${user.name} ${user.email}`.toLowerCase().includes(query.trim().toLowerCase())}
                            inputValue={toSearch}
                            onInputValueChange={(input, details) => { if (details.reason === "input-change") setToSearch(input) }}
                            onOpenChange={() => setToSearch("")}
                            onValueChange={(user) => { if (user) updateDraft({ requesterId: user.id }) }}
                        >
                            <ComboboxTrigger render={
                                <Button type="button" variant="ghost" disabled={disabled} className="h-auto min-h-8 min-w-0 justify-start whitespace-normal text-left">
                                    <span className="min-w-0 wrap-break-word" title={requester?.email}>{requester?.name || "Select requester"}</span>
                                    <Pencil />
                                </Button>
                            } />
                            <ComboboxContent>
                                <ComboboxInput id={toInputId} placeholder="Search name or email" disabled={disabled} />
                                <ComboboxEmpty>{usersQuery.isPending ? "Loading users..." : "No users found."}</ComboboxEmpty>
                                <ComboboxList>
                                    {(user: RecipientUser) => <ComboboxItem key={user.id} value={user}><RecipientLabel name={user.name} email={user.email} /></ComboboxItem>}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </div>
                    <div className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-start gap-2">
                        <FieldLabel htmlFor={ccInputId} className="pt-2">CC:</FieldLabel>
                        <Combobox<CcOption, true>
                            multiple items={ccOptions} value={selectedCc} disabled={disabled || ticket.ccRecipients === undefined}
                            itemToStringLabel={(recipient) => recipient.name} itemToStringValue={(recipient) => recipient.email}
                            isItemEqualToValue={(recipient, value) => recipient.email === value.email}
                            filter={(recipient, query) => `${recipient.name} ${recipient.email}`.toLowerCase().includes(query.trim().toLowerCase())}
                            inputValue={ccSearch} onInputValueChange={setCcSearch}
                            onValueChange={(recipients) => {
                                updateDraft({ ccEmails: recipients.map((recipient) => recipient.email) })
                                setCcSearch("")
                            }}
                        >
                            <ComboboxChips ref={ccAnchor} className="min-w-0">
                                <ComboboxValue>
                                    {(recipients: CcOption[]) => recipients.map((recipient) => (
                                        <ComboboxChip key={recipient.email} className="max-w-full" title={recipient.email}>
                                            <span className="min-w-0 truncate">{recipient.name}</span>
                                        </ComboboxChip>
                                    ))}
                                </ComboboxValue>
                                <ComboboxChipsInput id={ccInputId} placeholder="Search name or email" aria-label="CC recipients" />
                            </ComboboxChips>
                            <ComboboxContent anchor={ccAnchor}>
                                <ComboboxEmpty>{usersQuery.isPending ? "Loading users..." : "No recipients found."}</ComboboxEmpty>
                                <ComboboxList>
                                    {(recipient: CcOption) => <ComboboxItem key={recipient.email} value={recipient}><RecipientLabel {...recipient} /></ComboboxItem>}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </div>
                    {usersQuery.isError && (
                        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">
                            Could not load users.
                            <Button type="button" variant="outline" size="sm" disabled={disabled || usersQuery.isFetching} onClick={() => void usersQuery.refetch()}>Retry</Button>
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}