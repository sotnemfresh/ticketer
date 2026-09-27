export function formatRelativeTime(date: Date | string): string {
    const target = new Date(date)
    const diffMs = Date.now() - target.getTime()
    const diffSeconds = Math.round(diffMs / 1000)

    if (diffSeconds < 60) return 'just now'

    const diffMinutes = Math.round(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes}min ago`

    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.round(diffHours / 24)
    if (diffDays < 30) return `${diffDays}d ago`

    const diffMonths = Math.round(diffDays / 30)
    if (diffMonths < 12) return `${diffMonths}m ago`

    const diffYears = Math.round(diffDays / 365)
    return `${diffYears}y ago`
}