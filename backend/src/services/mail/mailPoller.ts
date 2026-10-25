import { prisma } from '../../lib/prisma.js'
import { processInboundMessage } from './inboundMailService.js'
import { fetchNewMessages } from './mailGraphService.js'

const SETTINGS_ID = 1
const INTERVAL_MS = Number(process.env.MAIL_POLL_INTERVAL_MS) || 60_000

// Fixed at startup so a failing first sync can't push the cutoff past mail that arrived meanwhile.
const defaultCutoff = new Date()

let timer: NodeJS.Timeout | undefined
let running = false

// Only used on the first sync, so old mailbox history doesn't turn into tickets.
function firstSyncCutoff(): Date {
  const configured = process.env.MAIL_FIRST_SYNC_CUTOFF
  if (!configured) return defaultCutoff

  const date = new Date(configured)
  if (Number.isNaN(date.getTime())) {
    console.warn('Invalid MAIL_FIRST_SYNC_CUTOFF, using startup time instead')
    return defaultCutoff
  }
  return date
}

async function pollOnce() {
  const settings = await prisma.mailboxSettings.findUnique({ where: { id: SETTINGS_ID } })
  if (!settings?.enabled || !settings.mailboxAddress) return

  const mailbox = settings.mailboxAddress
  const isFirstSync = settings.deltaLink === null
  const cutoff = firstSyncCutoff()

  try {
    const { messages, deltaLink } = await fetchNewMessages(mailbox, settings.deltaLink)

    for (const message of messages) {
      if (isFirstSync && new Date(message.receivedDateTime) < cutoff) continue

      const result = await processInboundMessage(message, mailbox)
      if (result.status !== 'skipped') {
        console.log(`Mail "${message.subject}" -> ${result.status} ticket #${result.ticketId}`)
      }
    }

    // Saved only after the whole batch succeeded, so a failure retries the same changes.
    await prisma.mailboxSettings.update({
      where: { id: SETTINGS_ID },
      data: { deltaLink, lastSyncAt: new Date(), lastError: null },
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.error('Mail poll failed:', reason)
    await prisma.mailboxSettings.update({
      where: { id: SETTINGS_ID },
      data: { lastError: reason.slice(0, 1000) },
    })
  }
}

async function tick() {
  if (running) return
  running = true
  try {
    await pollOnce()
  } catch (error) {
    console.error('Mail poller error:', error)
  } finally {
    running = false
  }
}

export function startMailPoller() {
  if (timer) return
  void tick()
  timer = setInterval(tick, INTERVAL_MS)
}

export function stopMailPoller() {
  if (timer) clearInterval(timer)
  timer = undefined
}