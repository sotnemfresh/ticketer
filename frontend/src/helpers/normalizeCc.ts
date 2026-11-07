export function normalizeCc(emails: readonly string[]): string[] {
    return [...new Set(emails.map((email) => email.trim().toLowerCase()))].sort()
}

export function sameCc(first: readonly string[], second: readonly string[]): boolean {
    const normalizedFirst = normalizeCc(first)
    const normalizedSecond = normalizeCc(second)
    return normalizedFirst.length === normalizedSecond.length &&
        normalizedFirst.every((email, index) => email === normalizedSecond[index])
}