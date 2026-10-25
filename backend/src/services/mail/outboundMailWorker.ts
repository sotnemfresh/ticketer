import { prisma } from '../../lib/prisma.js'
import { prepareDelivery, reconcileDelivery, sendPreparedDelivery } from './outboundMailService.js'

let timer: ReturnType<typeof setInterval> | undefined
let active: Promise<void> | undefined

async function processBatch() {
  const settings = await prisma.mailboxSettings.findUnique({ where: { id: 1 } })
  if (!settings?.enabled) return

  const now = new Date()
  await prisma.outboundDelivery.updateMany({
    where: { status: 'SENDING', leaseExpiresAt: { lte: now } },
    data: {
      status: 'UNKNOWN',
      nextReconcileAt: now,
      reconcileCount: 0,
      needsInvestigation: false,
      lastError: 'Send lease expired; reconciliation required',
      leaseToken: null,
      leaseExpiresAt: null,
    },
  })

  await prisma.outboundDelivery.updateMany({
    where: {
      status: 'PREPARING',
      leaseExpiresAt: { lte: now },
    },
    data: {
      status: 'FAILED',
      needsInvestigation: true,
      lastError: 'Preparation lease expired; review required before a manual retry',
      leaseToken: null,
      leaseExpiresAt: null,
    },
  })

  const jobs = await prisma.outboundDelivery.findMany({
    where: {
      message: { type: 'OUTBOUND' },
      OR: [
        { status: 'PENDING', nextAttemptAt: { lte: now } },
        { status: 'READY' },
      ],
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: 20,
    select: { id: true, status: true },
  })

  for (const job of jobs) {
    try {
      const prepared = job.status === 'READY' || await prepareDelivery(job.id)
      if (prepared) await sendPreparedDelivery(job.id)
    } catch (error) {
      console.error('Outbound delivery failed:', job.id, error)
    }
  }

  const checks = await prisma.outboundDelivery.findMany({
    where: {
      OR: [
        { status: 'UNKNOWN' },
        { status: 'ACCEPTED', metadataVerifiedAt: null },
      ],
      needsInvestigation: false,
      message: { type: 'OUTBOUND' },
      AND: [
        { OR: [{ nextReconcileAt: null }, { nextReconcileAt: { lte: now } }] },
        { OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lte: now } }] },
      ],
    },
    orderBy: [{ nextReconcileAt: 'asc' }, { id: 'asc' }],
    take: 20,
    select: { id: true },
  })

  for (const job of checks) {
    try {
      await reconcileDelivery(job.id)
    } catch (error) {
      console.error('Outbound reconciliation failed:', job.id, error)
    }
  }
}

function tick() {
  active ??= processBatch()
    .catch((error) => console.error('Outbound worker failed:', error))
    .finally(() => { active = undefined })
}

export function startOutboundMailWorker() {
  if (timer) return
  timer = setInterval(tick, 10_000)
  tick()
}

export async function stopOutboundMailWorker() {
  if (timer) clearInterval(timer)
  timer = undefined
  await active
}