import type { Ticket } from "@/types/ticket"

export type TicketViewId = "my-unsolved" | "unassigned" | "assigned" | "all-active"

export interface TicketView {
  id: TicketViewId
  label: string
  // "grouped" renders the per-user table split by status category.
  table: "grouped" | "flat"
  filter: (ticket: Ticket, currentUserId?: number) => boolean
}

export const ticketViews: readonly TicketView[] = [
  {
    id: "my-unsolved",
    label: "Your unsolved tickets",
    table: "grouped",
    filter: (t, userId) =>
      t.assignee?.id === userId && t.status !== "solved" && t.status !== "closed",
  },
  {
    id: "unassigned",
    label: "Unassigned tickets",
    table: "flat",
    filter: (t) => !t.assignee,
  },
  {
    id: "assigned",
    label: "Open and assigned tickets",
    table: "flat",
    filter: (t) => !!t.assignee && t.status == "open"
  },
  {
    id: "all-active",
    label: "All active tickets",
    table: "flat",
    filter: (t) => t.status !== "closed",
  },
]

export const DEFAULT_VIEW_ID: TicketViewId = "my-unsolved"