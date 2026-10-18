"use client"
import * as React from "react"
import { useTable, type ColumnDef, type SortingState } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { features, type DataTableFeatures } from "./data-table-features"
import type { Ticket, TicketStatus } from "@/types/ticket"

const NON_NAVIGABLE_COLUMNS = new Set(["select", "actions"])

const GROUPS: { label: string; statuses: TicketStatus[] }[] = [
    { label: "Open", statuses: ["new", "open"] },
    { label: "Pending", statuses: ["pending"] },
    { label: "On-hold", statuses: ["on-hold"] },
]

interface Props {
    columns: ColumnDef<DataTableFeatures, Ticket>[]
    data: Ticket[]
    onRowClick?: (ticket: Ticket) => void
}

export function GroupedDataTable({ columns, data, onRowClick }: Props) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [rowSelection, setRowSelection] = React.useState({})
    const table = useTable({
        features, data, columns,
        state: { sorting, rowSelection },
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
    })

    const rows = table.getRowModel().rows

    return (
        <div className="overflow-hidden rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                        <TableRow key={hg.id}>
                            {hg.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {GROUPS.map(({ label, statuses }) => {
                        const groupRows = rows.filter((r) => statuses.includes(r.original.status))
                        if (!groupRows.length) return null
                        return (
                            <React.Fragment key={label}>
                                <TableRow className="bg-muted hover:bg-muted">
                                    <TableCell colSpan={columns.length} className="py-1 text-xs font-semibold uppercase text-muted-foreground">
                                        Status category: {label}
                                    </TableCell>
                                </TableRow>
                                {groupRows.map((row) => (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                        {row.getVisibleCells().map((cell) => {
                                            const navigable = onRowClick && !NON_NAVIGABLE_COLUMNS.has(cell.column.id)
                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    className={navigable ? "cursor-pointer" : undefined}
                                                    onClick={navigable ? () => onRowClick(row.original) : undefined}
                                                >
                                                    <table.FlexRender cell={cell} />
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </React.Fragment>
                        )
                    })}
                    {!rows.length && (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}