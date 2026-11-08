import { useEffect, useId, useRef, useState, type SyntheticEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function NavbarSearch() {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const inputId = useId()
    const navigate = useNavigate()

    useEffect(() => {
        if (!open) return

        function handlePointerDown(event: PointerEvent) {
            if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
                setOpen(false)
            }
        }

        document.addEventListener('pointerdown', handlePointerDown)
        return () => document.removeEventListener('pointerdown', handlePointerDown)
    }, [open])

    function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()
        const query = String(new FormData(event.currentTarget).get('q') ?? '').trim()
        if (!query || query.length > 200) return

        const destination = /^\d+$/.test(query)
            ? `/tickets/${Number(query)}`
            : `/search?${new URLSearchParams({ q: query, view: 'tickets' })}`

        setOpen(false)
        navigate(destination)
    }

    return (
        <div
            ref={containerRef}
            className="flex min-w-0 items-center gap-2"
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
            }}
            onKeyDown={(event) => {
                if (open && event.key === 'Escape') {
                    event.preventDefault()
                    setOpen(false)
                    triggerRef.current?.focus()
                }
            }}
        >
            <Button
                ref={triggerRef}
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Search"
                aria-expanded={open}
                aria-controls={open ? inputId : undefined}
                onClick={() => setOpen((previous) => !previous)}
            >
                <Search aria-hidden="true" />
            </Button>

            {open && (
                <form onSubmit={handleSubmit} className="w-40 sm:w-64">
                    <Input
                        id={inputId}
                        name="q"
                        autoFocus
                        maxLength={200}
                        aria-label="Search"
                        placeholder="Search"
                    />
                </form>
            )}
        </div>
    )
}