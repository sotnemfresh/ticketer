import type { Ticket } from "@/types/ticket"

export const ticketViews = [
  { id: "all", label: "All tickets", filter: () => true },
  { id: "unsolved", label: "Unsolved", filter: (t: Ticket) => t.status !== "solved" && t.status !== "closed" },
  { id: "unassigned", label: "Unassigned", filter: (t: Ticket) => !t.assignee },
] as const