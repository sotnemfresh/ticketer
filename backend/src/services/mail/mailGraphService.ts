// Thin wrappers over the Graph mail endpoints; no database or filesystem access here.
import { graphJson, graphRequest } from './graphClient.js'

const user = (mailbox: string) => `/users/${encodeURIComponent(mailbox)}`

const toRecipient = (address: string) => ({ emailAddress: { address } })

export type GraphRecipient = { emailAddress: { address: string; name?: string } }

export type GraphMessage = {
  id: string
  internetMessageId: string
  conversationId: string
  subject: string | null
  from?: GraphRecipient
  toRecipients: GraphRecipient[]
  ccRecipients: GraphRecipient[]
  body: { contentType: 'html' | 'text'; content: string }
  receivedDateTime: string
  hasAttachments: boolean
  internetMessageHeaders?: { name: string; value: string }[]
  '@removed'?: unknown
}

const MESSAGE_FIELDS =
  'id,internetMessageId,conversationId,subject,from,toRecipients,ccRecipients,body,receivedDateTime,hasAttachments'

// Pass the saved deltaLink to get only changes since the last poll; null starts a full sync.
export async function fetchNewMessages(mailbox: string, deltaLink: string | null) {
  let url: string | undefined =
    deltaLink ?? `${user(mailbox)}/mailFolders/inbox/messages/delta?$select=${MESSAGE_FIELDS}`

  const messages: GraphMessage[] = []
  let newDeltaLink = deltaLink

  while (url) {
    const page: {
      value: GraphMessage[]
      '@odata.nextLink'?: string
      '@odata.deltaLink'?: string
    } = await graphJson(url, {
      headers: { Prefer: 'odata.maxpagesize=50, IdType="ImmutableId"' },
    })

    messages.push(...page.value.filter((m) => !m['@removed']))
    newDeltaLink = page['@odata.deltaLink'] ?? newDeltaLink
    url = page['@odata.nextLink']
  }

  return { messages, deltaLink: newDeltaLink }
}

// Delta results don't include In-Reply-To/References, so fetch the headers per message.
export async function getMessageHeaders(mailbox: string, messageId: string) {
  const msg = await graphJson<Pick<GraphMessage, 'internetMessageHeaders'>>(
    `${user(mailbox)}/messages/${encodeURIComponent(messageId)}?$select=internetMessageHeaders`,
  )
  const header = (name: string) =>
    msg.internetMessageHeaders?.find((h) => h.name.toLowerCase() === name)?.value ?? null

  return {
    inReplyTo: header('in-reply-to'),
    references: header('references')?.split(/\s+/).filter(Boolean) ?? [],
    autoSubmitted: header('auto-submitted'),
    precedence: header('precedence'),
  }
}

export type GraphAttachmentInfo = {
  id: string
  name: string
  contentType: string
  size: number
  isInline: boolean
  '@odata.type': string
}

// contentId exists only on fileAttachment, so it can't be selected in the list call.
export async function listAttachments(mailbox: string, messageId: string) {
  const res = await graphJson<{ value: GraphAttachmentInfo[] }>(
    `${user(mailbox)}/messages/${encodeURIComponent(messageId)}/attachments?$select=id,name,contentType,size,isInline`,
  )
  // Skip item/reference attachments; only real files are stored.
  return res.value.filter((a) => a['@odata.type'] === '#microsoft.graph.fileAttachment')
}

export async function getFileAttachment(mailbox: string, messageId: string, attachmentId: string) {
  const attachment = await graphJson<{ contentId: string | null; contentBytes: string }>(
    `${user(mailbox)}/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`,
  )
  return {
    contentId: attachment.contentId,
    data: Buffer.from(attachment.contentBytes, 'base64'),
  }
}

// Drafts are used instead of the one-shot reply/sendMail calls because only a draft exposes
// its Message-ID before sending, which is needed to thread the customer's answer back.
export type GraphDraft = {
  id: string
  conversationId: string
  body: { contentType: string; content: string }
}

export async function createReplyDraft(mailbox: string, messageId: string) {
  return graphJson<GraphDraft>(`${user(mailbox)}/messages/${encodeURIComponent(messageId)}/createReply`, {
    method: 'POST',
    headers: { Prefer: 'IdType="ImmutableId"' },
    body: '{}',
  })
}

export async function createNewDraft(
  mailbox: string,
  draft: { subject: string; html: string; to: string[]; cc: string[] },
) {
  return graphJson<GraphDraft>(`${user(mailbox)}/messages`, {
    method: 'POST',
    headers: { Prefer: 'IdType="ImmutableId"' },
    body: JSON.stringify({
      subject: draft.subject,
      body: { contentType: 'HTML', content: draft.html },
      toRecipients: draft.to.map(toRecipient),
      ccRecipients: draft.cc.map(toRecipient),
    }),
  })
}

export async function updateDraft(
  mailbox: string,
  draftId: string,
  update: { html: string; to: string[]; cc: string[] },
) {
  await graphRequest(`${user(mailbox)}/messages/${encodeURIComponent(draftId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'IdType="ImmutableId"' },
    body: JSON.stringify({
      body: { contentType: 'HTML', content: update.html },
      toRecipients: update.to.map(toRecipient),
      ccRecipients: update.cc.map(toRecipient),
    }),
  })
}

export async function getDeliveryMessage(mailbox: string, messageId: string) {
  return graphJson<{
    id: string
    isDraft: boolean
    internetMessageId: string | null
    parentFolderId: string
    sentDateTime: string | null
  }>(
    `${user(mailbox)}/messages/${encodeURIComponent(messageId)}` +
    '?$select=id,isDraft,internetMessageId,parentFolderId,sentDateTime',
    { headers: { Prefer: 'IdType="ImmutableId"' } },
  )
}

export async function getSentItemsFolderId(mailbox: string) {
  const folder = await graphJson<{ id: string }>(
    `${user(mailbox)}/mailFolders/sentitems?$select=id`,
    { headers: { Prefer: 'IdType="ImmutableId"' } },
  )
  return folder.id
}

export async function sendDraft(mailbox: string, draftId: string) {
  await graphRequest(`${user(mailbox)}/messages/${encodeURIComponent(draftId)}/send`, {
    method: 'POST',
    headers: { Prefer: 'IdType="ImmutableId"' },
  })
}