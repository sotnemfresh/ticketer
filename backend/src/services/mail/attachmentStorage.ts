import { randomUUID } from 'node:crypto'
import { createReadStream, type ReadStream } from 'node:fs'
import { access, mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Read lazily so dotenv has loaded before the env var is checked.
const baseDir = () =>
  path.resolve(process.env.ATTACHMENT_STORAGE_DIR ?? path.join(process.cwd(), 'storage', 'attachments'))

// Keys are generated here, so anything not matching this shape is rejected (blocks path traversal).
const KEY_PATTERN = /^[0-9a-f]{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function resolveKey(storageKey: string) {
  if (!KEY_PATTERN.test(storageKey)) throw new Error('Invalid storage key')

  const root = baseDir()
  const fullPath = path.join(root, storageKey)
  if (!fullPath.startsWith(root + path.sep)) throw new Error('Invalid storage key')
  return fullPath
}

export async function saveAttachment(data: Buffer): Promise<string> {
  const id = randomUUID()
  const storageKey = `${id.slice(0, 2)}/${id}`
  const fullPath = resolveKey(storageKey)

  await mkdir(path.dirname(fullPath), { recursive: true })

  // Write then rename so a crash never leaves a half-written file under the real key.
  const tempPath = `${fullPath}.tmp`
  await writeFile(tempPath, data)
  await rename(tempPath, fullPath)

  return storageKey
}

export function readAttachment(storageKey: string): ReadStream {
  return createReadStream(resolveKey(storageKey))
}

export async function attachmentExists(storageKey: string): Promise<boolean> {
  try {
    await access(resolveKey(storageKey))
    return true
  } catch {
    return false
  }
}

// Safe to call repeatedly; the purge job may retry.
export async function removeAttachment(storageKey: string): Promise<void> {
  await rm(resolveKey(storageKey), { force: true })
}