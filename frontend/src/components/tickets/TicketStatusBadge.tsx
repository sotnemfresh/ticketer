import { Badge } from "@/components/ui/badge"
import type { TicketStatus } from "@/types/ticket"

type DisplayTicketStatus = TicketStatus | "on-hold"

const statusStyles: Record<DisplayTicketStatus, string> = {
  open: "border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  new: "border-yellow-200 bg-yellow-100 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  pending: "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  closed: "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
  solved: "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
  "on-hold": "border-black bg-black text-white dark:border-black dark:bg-black dark:text-white",
}

interface TicketStatusBadgeProps {
  status: DisplayTicketStatus
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase() as DisplayTicketStatus
  const label = normalizedStatus === "on-hold"
    ? "On-hold"
    : normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)

  return (
    <Badge variant="outline" className={statusStyles[normalizedStatus]}>
      {label}
    </Badge>
  )
}