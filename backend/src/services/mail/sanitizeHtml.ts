import sanitizeHtml from 'sanitize-html'

// Bounds sanitizer work on huge or malicious messages; the sanitizer closes any cut-off tags.
const MAX_HTML_LENGTH = 500_000

const ALLOWED_TAGS = [
  'p', 'br', 'div', 'span', 'b', 'strong', 'i', 'em', 'u', 's', 'sub', 'sup',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 'hr',
  'ul', 'ol', 'li', 'a', 'img',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
]

// Blocks url(), expression() and anything that could load or run content from CSS.
const SAFE_CSS_VALUE = [/^(?!.*(url|expression|javascript|@import))[#\w\s%.,()-]+$/i]

const ALLOWED_STYLES = {
  '*': {
    color: SAFE_CSS_VALUE,
    'background-color': SAFE_CSS_VALUE,
    'font-size': SAFE_CSS_VALUE,
    'font-weight': SAFE_CSS_VALUE,
    'font-style': SAFE_CSS_VALUE,
    'text-decoration': SAFE_CSS_VALUE,
    'text-align': SAFE_CSS_VALUE,
  },
}

export type SanitizeOptions = {
  // Maps Content-ID (without "cid:") to the authenticated URL serving that attachment.
  cidMap?: Map<string, string>
}

const ATTACHMENT_URL_PREFIX = '/api/attachments/'

export function sanitizeEmailHtml(html: string, options: SanitizeOptions = {}): string {
  const cidMap = options.cidMap ?? new Map<string, string>()

  return sanitizeHtml(html.slice(0, MAX_HTML_LENGTH), {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      img: ['src', 'alt', 'width', 'height'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
      '*': ['style'],
    },
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['cid'] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: 'noopener noreferrer', target: '_blank' },
      }),
      img: (tagName, attribs) => {
        const src = attribs.src ?? ''
        if (src.toLowerCase().startsWith('cid:')) {
          const mapped = cidMap.get(src.slice(4).replace(/^<|>$/g, ''))
          return { tagName, attribs: mapped ? { ...attribs, src: mapped } : attribs }
        }
        return { tagName, attribs }
      },
    },
    // Remote images are dropped to block tracking pixels and IP leaks.
    exclusiveFilter: (frame) =>
      frame.tag === 'img' &&
      !(frame.attribs.src ?? '').startsWith(ATTACHMENT_URL_PREFIX) &&
      !(frame.attribs.src ?? '').toLowerCase().startsWith('cid:'),
  })
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

export function htmlToPlainText(html: string): string {
  const withBreaks = html
    .slice(0, MAX_HTML_LENGTH)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)>/gi, '\n')

  const stripped = sanitizeHtml(withBreaks, { allowedTags: [], allowedAttributes: {} })

  return stripped
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}