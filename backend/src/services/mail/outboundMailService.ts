// builds To/CC and follower notifications

import { prisma } from '../../lib/prisma.js'
import {
  createNewDraft,
  createReplyDraft,
  getDraftMessageId,
  sendDraft,
  updateDraft,
} from './mailGraphService.js'
import { sanitizeEmailHtml } from './sanitizeHtml.js'

const SETTINGS_ID = 1

// Single place that decides which mailbox sends; per-agent sending would change only this.
async function resolveSenderMailbox() {
  const settings = await prisma.mailboxSettings.findUnique({ where: { id: SETTINGS_ID } })
  if (!settings?.enabled || !settings.mailboxAddress) {
    throw new Error('Support mailbox is not configured or not enabled')
  }
  return settings.mailboxAddress
}

function textToHtml(text: string) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
  return `<div>${escaped.replace(/\r?\n/g, '<br>')}</div>`
}

// Graph's reply draft holds the quoted thread; the agent's text goes above it.
function placeAboveQuote(draftHtml: string, replyHtml: string) {
  const body = /<body[^>]*>/i.exec(draftHtml)
  if (!body) return `${replyHtml}<br>${draftHtml}`

  const end = body.index + body[0].length
  return `${draftHtml.slice(0, end)}${replyHtml}<br>${draftHtml.slice(end)}`
}

// Emails an OUTBOUND ticket message to the requester and CC followers, then records its Message-ID.
export async function sendTicketReply(messageId: number) {
  const message = await prisma.ticketMessage.findUniqueOrThrow({
    where: { id: messageId },
    include: {
      ticket: {
        include: {
          requester: { select: { email: true } },
          followers: { select: { email: true, type: true } },
        },
      },
    },
  })
  if (message.type !== 'OUTBOUND') throw new Error('Only OUTBOUND messages are emailed')

  const { ticket } = message
  const to = [ticket.requester.email]
  const cc = ticket.followers
    .filter((f) => f.type === 'CC' && !to.includes(f.email))
    .map((f) => f.email)

  const mailbox = await resolveSenderMailbox()
  const html = sanitizeEmailHtml(message.bodyHtml ?? textToHtml(message.bodyText))

  // Replying to the customer's latest email keeps the thread, headers and subject intact.
  const anchor = await prisma.ticketMessage.findFirst({
    where: { ticketId: ticket.id, type: 'INBOUND', graphMessageId: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: { graphMessageId: true, messageIdHeader: true },
  })

  let draftId: string
  if (anchor?.graphMessageId) {
    const draft = await createReplyDraft(mailbox, anchor.graphMessageId)
    await updateDraft(mailbox, draft.id, {
      html: placeAboveQuote(draft.body.content, html),
      to,
      cc,
    })
    draftId = draft.id
  } else {
    const draft = await createNewDraft(mailbox, { subject: ticket.subject, html, to, cc })
    draftId = draft.id
  }

  // Read before sending: the draft id stops existing once the message moves to Sent Items.
  const internetMessageId = await getDraftMessageId(mailbox, draftId)
  await sendDraft(mailbox, draftId)

  await prisma.ticketMessage.update({
    where: { id: message.id },
    data: {
      bodyHtml: html,
      messageIdHeader: internetMessageId,
      inReplyTo: anchor?.messageIdHeader ?? null,
    },
  })
}