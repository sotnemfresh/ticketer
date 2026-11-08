import type { SyntheticEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTicketSearch } from '@/services/searchService'
import { DataTable } from '@/components/tickets/ticketPage/ticketList/data-table'
import { columns } from '@/components/tickets/ticketPage/ticketList/columns'

export default function SearchPage() {
    const [params, setParams] = useSearchParams()
    const navigate = useNavigate()
    const location = useLocation()
    const query = (params.get('q') ?? '').trim()
    const cursor = params.get('cursor')
    const { data, isLoading, isFetching, error } = useTicketSearch(query, cursor)
    const validQuery = query.length > 0 && query.length <= 200
    const previousCursors: (string | null)[] = location.state?.searchQuery === query
        ? location.state.searchCursors ?? []
        : []

    function changePage(nextCursor: string | null, history: (string | null)[]) {
        const nextParams = new URLSearchParams(params)
        if (nextCursor) nextParams.set('cursor', nextCursor)
        else nextParams.delete('cursor')
        setParams(nextParams, {
            state: { searchQuery: query, searchCursors: history },
        })
    }

    function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()
        const value = String(
            new FormData(event.currentTarget).get('q') ?? ''
        ).trim()
        if (!value || value.length > 200) return

        if (/^\d+$/.test(value)) {
            navigate(`/tickets/${Number(value)}`)
            return
        }
        setParams({ q: value, view: 'tickets' }, { state: null })
    }

    return (
        <section className="mx-auto w-full max-w-6xl space-y-5 p-4 md:p-8">
            <h1 className="text-xl font-semibold">Tickets</h1>
            <form key={query} onSubmit={handleSubmit} role="search" className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-2 size-4 text-muted-foreground" />
                    <Input name="q" aria-label="Search tickets" defaultValue={query} maxLength={200} placeholder="Search tickets" className="pl-9" />
                </div>
                <Button type="button" variant="outline" disabled>
                    <SlidersHorizontal aria-hidden="true" /> Filters
                </Button>
            </form>
            {!query && <p className="text-sm text-muted-foreground">No search entered.</p>}
            {query.length > 200 && <p role="alert">Search must not exceed 200 characters.</p>}
            {validQuery && isFetching && <p role="status">{isLoading ? 'Loading...' : 'Updating...'}</p>}
            {validQuery && error && <p role="alert" className="text-destructive">{error.message}</p>}
            {validQuery && !isLoading && !error && data && (
                <DataTable
                    key={JSON.stringify([query, cursor])}
                    columns={columns}
                    data={data.tickets}
                    onRowClick={(ticket) => navigate(`/tickets/${ticket.id}`)}
                    serverPagination={{
                        canPrevious: !!cursor && !isFetching,
                        canNext: !!data.nextCursor && !isFetching,
                        onPrevious: () => changePage(previousCursors.at(-1) ?? null, previousCursors.slice(0, -1)),
                        onNext: () => changePage(data.nextCursor, [...previousCursors, cursor]),
                    }}
                />
            )}
        </section>
    )
}