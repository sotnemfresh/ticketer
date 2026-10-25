// ticket matching, sanitizing, saving
/*
Processes each message received through the inbound mail system.

Skip message if messageIdHeader exists.
Drop auto-replies and loops, and ignore mail from the mailbox itself. 

Match it to a ticket by In-Reply-To or References against stored message IDs, 
then by the [#123] token in the subject, then by conversationId. 
If nothing matches, create a new ticket. 

Find or create the requester by sender email. 
Add To/CC addresses as followers. 
Strip quoted reply history and signatures. 
Store the message and its attachments. 
 */
import { createHash } from 'node:crypto'
import { prisma } from '../../lib/prisma.js'
import { removeAttachment, saveAttachment } from './attachmentStorage.js'
import {
  getFileAttachment,
  getMessageHeaders,
  listAttachments,
  type GraphMessage,
} from './mailGraphService.js'
import { htmlToPlainText, sanitizeEmailHtml } from './sanitizeHtml.js'
import { stripQuotedHtml, stripQuotedText } from './stripQuotedReply.js'

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

type SavedAttachment = {
  filename: string
  mimeType: string
  size: number
  contentId: string | null
  isInline: boolean
  storageKey: string
  graphAttachmentId: string
  contentHash: string
}

// A file already stored on the ticket; the new message's cid: image points at it instead.
type ReusedAttachment = { attachmentId: number; contentId: string | null }

export type InboundResult =
  | { status: 'skipped'; reason: 'no-sender' | 'own-mail' | 'duplicate' | 'auto-reply' }
  | { status: 'created'; ticketId: number; messageId: number }
  | { status: 'appended'; ticketId: number; messageId: number }

const AUTO_PRECEDENCE = ['bulk', 'junk', 'list', 'auto_reply']
const REOPEN_FROM = ['SOLVED', 'CLOSED', 'PENDING', 'ON_HOLD'] as const

// Auto-Submitted is "no" for human mail; any other value means a machine sent it.
function isAutoReply(headers: { autoSubmitted: string | null; precedence: string | null }) {
  const autoSubmitted = headers.autoSubmitted?.trim().toLowerCase()
  if (autoSubmitted && autoSubmitted !== 'no') return true
  return AUTO_PRECEDENCE.includes(headers.precedence?.trim().toLowerCase() ?? '')
}

// conversationId is a weak signal, so the sender must already belong to the ticket.
async function isParticipant(ticketId: number, email: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      requester: { select: { email: true } },
      followers: { select: { email: true } },
    },
  })
  if (!ticket) return false

  const known = [ticket.requester.email, ...ticket.followers.map((f) => f.email)]
  if (known.some((e) => e.toLowerCase() === email)) return true

  const agent = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' }, role: { in: ['ADMIN', 'AGENT'] } },
    select: { id: true },
  })
  return agent !== null
}

// Message-ID headers are unguessable, so they win over the weaker conversationId match.
async function findTicketId(params: {
  inReplyTo: string | null
  references: string[]
  conversationId: string
  senderEmail: string
}): Promise<number | null> {
  const messageIds = [params.inReplyTo, ...params.references].filter((id): id is string => !!id)
  if (messageIds.length > 0) {
    const match = await prisma.ticketMessage.findFirst({
      where: { messageIdHeader: { in: messageIds } },
      orderBy: { createdAt: 'desc' },
      select: { ticketId: true },
    })
    if (match) return match.ticketId
  }

  const byConversation = await prisma.ticket.findFirst({
    where: { conversationId: params.conversationId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })
  if (byConversation && (await isParticipant(byConversation.id, params.senderEmail))) {
    return byConversation.id
  }

  return null
}

// A ticket needs a requester, so unknown senders become CUSTOMER users without a password.
async function findOrCreateRequester(email: string, name: string | undefined) {
  // User.email is unique but case-sensitive, so match insensitively to avoid duplicate accounts.
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  })
  if (existing) return existing

  return prisma.user.create({
    data: { email, name: name?.trim() || email.split('@')[0], role: 'CUSTOMER' },
  })
}

function collectRecipientEmails(message: GraphMessage, mailbox: string) {
  const all = [...message.toRecipients, ...message.ccRecipients]
    .map((r) => r.emailAddress.address.toLowerCase())
    .filter((email) => email !== mailbox.toLowerCase())
  return [...new Set(all)]
}

function safeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').slice(0, 200) || 'attachment'
}

async function removeSavedAttachments(saved: SavedAttachment[]) {
  await Promise.all(saved.map((a) => removeAttachment(a.storageKey).catch(() => undefined)))
}

// Files are saved before the database write; callers must remove them if that write fails.
// Replies often re-attach earlier files, so identical content on the same ticket is stored once.
async function saveMessageAttachments(
  mailbox: string,
  message: GraphMessage,
  existingTicketId: number | null,
) {
  const saved: SavedAttachment[] = []
  const reused: ReusedAttachment[] = []

  // Graph's hasAttachments is false for messages with only inline images, so also look for cid: in the body.
  if (!message.hasAttachments && !message.body.content.includes('cid:')) return { saved, reused }

  try {
    for (const attachment of await listAttachments(mailbox, message.id)) {
      if (attachment.size > MAX_ATTACHMENT_BYTES) {
        console.warn(`Skipping oversized attachment "${attachment.name}" (${attachment.size} bytes)`)
        continue
      }

      const { data, contentId } = await getFileAttachment(mailbox, message.id, attachment.id)
      const contentHash = createHash('sha256').update(data).digest('hex')

      if (existingTicketId !== null) {
        // Purged files (no storageKey) don't count, so a reopened ticket gets them again.
        const duplicate = await prisma.attachment.findFirst({
          where: {
            contentHash,
            storageKey: { not: null },
            message: { ticketId: existingTicketId },
          },
          select: { id: true },
        })
        if (duplicate) {
          reused.push({ attachmentId: duplicate.id, contentId })
          continue
        }
      }

      saved.push({
        filename: safeFilename(attachment.name),
        mimeType: attachment.contentType,
        size: data.length,
        contentId,
        isInline: attachment.isInline,
        storageKey: await saveAttachment(data),
        graphAttachmentId: attachment.id,
        contentHash,
      })
    }
  } catch (error) {
    await removeSavedAttachments(saved)
    throw error
  }
  return { saved, reused }
}

// Pieces (a) to (d): a message joins an existing ticket when it can be threaded, else opens a new one.
export async function processInboundMessage(
  message: GraphMessage,
  mailbox: string,
): Promise<InboundResult> {
  const sender = message.from?.emailAddress
  if (!sender?.address) return { status: 'skipped', reason: 'no-sender' }

  const senderEmail = sender.address.toLowerCase()
  if (senderEmail === mailbox.toLowerCase()) return { status: 'skipped', reason: 'own-mail' }

  const existing = await prisma.ticketMessage.findUnique({
    where: { messageIdHeader: message.internetMessageId },
    select: { id: true },
  })
  if (existing) return { status: 'skipped', reason: 'duplicate' }

  // Fetched last because it costs one Graph call per message.
  const headers = await getMessageHeaders(mailbox, message.id)
  if (isAutoReply(headers)) return { status: 'skipped', reason: 'auto-reply' }

  const requester = await findOrCreateRequester(senderEmail, sender.name)

  const isHtml = message.body.contentType === 'html'

  const existingTicketId = await findTicketId({
    inReplyTo: headers.inReplyTo,
    references: headers.references,
    conversationId: message.conversationId,
    senderEmail,
  })

  // The first message of a ticket keeps its quoted text; only replies are trimmed.
  const content =
    existingTicketId === null
      ? message.body.content
      : isHtml
        ? stripQuotedHtml(message.body.content)
        : stripQuotedText(message.body.content)
  const bodyText = isHtml ? htmlToPlainText(content) : content

  // Only people already on the ticket may add recipients as followers.
  const mayAddFollowers =
    existingTicketId === null || (await isParticipant(existingTicketId, senderEmail))

  const { saved: savedAttachments, reused: reusedAttachments } = await saveMessageAttachments(
    mailbox,
    message,
    existingTicketId,
  )

  const created = await prisma.$transaction(async (tx) => {
    let ticketId = existingTicketId

    if (ticketId === null) {
      const ticket = await tx.ticket.create({
        data: {
          subject: message.subject?.trim() || '(no subject)',
          source: 'EMAIL',
          conversationId: message.conversationId,
          requesterId: requester.id,
        },
      })
      ticketId = ticket.id
    } else {
      // A customer reply reopens tickets that were waiting, solved or closed.
      await tx.ticket.updateMany({
        where: { id: ticketId, status: { in: [...REOPEN_FROM] } },
        data: { status: 'OPEN', closedAt: null },
      })
      await tx.ticket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } })
    }

    const ticketMessage = await tx.ticketMessage.create({
      data: {
        ticketId,
        type: 'INBOUND',
        authorId: requester.id,
        authorEmail: senderEmail,
        authorName: requester.name,
        bodyText,
        messageIdHeader: message.internetMessageId,
        inReplyTo: headers.inReplyTo,
        references: headers.references,
        graphMessageId: message.id,
        attachments: { create: savedAttachments },
      },
      include: { attachments: { select: { id: true, contentId: true } } },
    })

    // bodyHtml is written after the insert because cid: images need the attachment row IDs.
    if (isHtml) {
      const cidMap = new Map<string, string>()
      for (const reused of reusedAttachments) {
        if (reused.contentId) cidMap.set(reused.contentId, `/api/attachments/${reused.attachmentId}`)
      }
      for (const attachment of ticketMessage.attachments) {
        if (attachment.contentId) cidMap.set(attachment.contentId, `/api/attachments/${attachment.id}`)
      }
      await tx.ticketMessage.update({
        where: { id: ticketMessage.id },
        data: { bodyHtml: sanitizeEmailHtml(content, { cidMap }) },
      })
    }

    if (mayAddFollowers) {
      const owner = await tx.ticket.findUniqueOrThrow({
        where: { id: ticketId },
        select: { requester: { select: { email: true } } },
      })
      const requesterEmail = owner.requester.email.toLowerCase()

      await tx.ticketFollower.createMany({
        data: collectRecipientEmails(message, mailbox)
          .filter((email) => email !== requesterEmail)
          .map((email) => ({ ticketId, email, type: 'CC' as const })),
        skipDuplicates: true,
      })
    }

    return { ticketId, messageId: ticketMessage.id }
  })
  // The message is not committed on failure, so a retry must not find orphaned files.
  .catch(async (error: unknown) => {
    await removeSavedAttachments(savedAttachments)
    throw error
  })

  return {
    status: existingTicketId === null ? 'created' : 'appended',
    ticketId: created.ticketId,
    messageId: created.messageId,
  }
}