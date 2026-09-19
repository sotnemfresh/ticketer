export function diffChanges<T extends object>(
  original: Partial<T>,
  updated: T,
): Partial<T> {
  const changes: Partial<T> = {}

  for (const key of Object.keys(updated) as (keyof T)[]) {
    if (updated[key] !== original[key]) {
      changes[key] = updated[key]
    }
  }

  return changes
}