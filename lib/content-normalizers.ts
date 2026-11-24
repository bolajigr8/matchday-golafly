type RichTextLike =
  | string
  | null
  | undefined
  | {
      html?: unknown
    }

export function getHtmlContent(value: RichTextLike): string {
  if (typeof value === 'string') return value
  if (
    value &&
    typeof value === 'object' &&
    'html' in value &&
    typeof value.html === 'string'
  ) {
    return value.html
  }
  return ''
}

export function stripHtmlToText(value: RichTextLike): string {
  const html = getHtmlContent(value)
  if (!html) return ''

  return html
    .replace(/<p>\s*<\/p>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim()
}

export function isHtmlLike(value: RichTextLike): boolean {
  const html = getHtmlContent(value)
  return html.includes('<')
}
