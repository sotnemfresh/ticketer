/*
 * Utility to strip quoted replies from email content.
 */

const HTML_MARKERS = [
  /id=["']divRplyFwdMsg["']/i, // Outlook web / new Outlook reply header
  /id=["']appendonsend["']/i, // Outlook anchor placed right before the quoted block
  /class=["'][^"']*gmail_quote[^"']*["']/i,
  /<blockquote[^>]*type=["']cite["']/i, // Apple Mail
  /border-top:\s*solid\s*#[0-9a-f]{6}\s*1\.0pt/i, // Outlook desktop divider above "From:"
]

const TEXT_MARKERS = [
  /^On [\s\S]{1,300}?wrote:\s*$/m,
  /^-{2,}\s*Original Message\s*-{2,}\s*$/im,
  /^From:[^\n]*\r?\n(?:Sent|Date):[^\n]*\r?\n(?:To|Cc|Subject):/im,
  /^_{10,}\s*\r?\n\s*From:/m,
  /^>/m,
]

function firstHtmlMarker(html: string) {
  let cut = -1
  for (const marker of HTML_MARKERS) {
    const match = marker.exec(html)
    if (!match) continue
    // Cut at the start of the tag that carries the marker attribute.
    const tagStart = html.lastIndexOf('<', match.index)
    if (tagStart >= 0 && (cut === -1 || tagStart < cut)) cut = tagStart
  }
  return cut
}

// Only the last few characters are inspected so huge inputs can't cause slow regex backtracking.
function trimTrailingMarkup(html: string) {
  let result = html
  for (;;) {
    const tail = result.slice(-300)
    const trimmed = tail.replace(/(?:<hr[^>]*>|<div[^>]*>\s*<\/div>|<br\s*\/?>|\s+)$/i, '')
    if (trimmed === tail) return result
    result = result.slice(0, result.length - tail.length) + trimmed
  }
}

function hasVisibleContent(html: string) {
  if (/<img\b/i.test(html)) return true
  const text = html
    .replace(/<(style|head|title)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|\s/g, '')
  return text.length > 0
}

// Returns the input unchanged when nothing precedes the quote, e.g. a forwarded message.
export function stripQuotedHtml(html: string): string {
  const cut = firstHtmlMarker(html)
  if (cut < 0) return html

  const head = trimTrailingMarkup(html.slice(0, cut))
  return hasVisibleContent(head) ? head : html
}

export function stripQuotedText(text: string): string {
  let cut = -1
  for (const marker of TEXT_MARKERS) {
    const match = marker.exec(text)
    if (match && (cut === -1 || match.index < cut)) cut = match.index
  }
  if (cut < 0) return text

  const head = text.slice(0, cut).trimEnd()
  return head.trim() ? head : text
}