'use client'

import type { AxiosResponse } from 'axios'

/* Private files (match tickets, venue instructions) need the Bearer token, and
 * a plain <a href> cannot send one. So the file is fetched with the right axios
 * client (fan or admin token), turned into a Blob and handed to the browser as
 * a download (Ticket dashboards contract §2). Used by the fan Tickets page and
 * the admin MatchTickets page. */

/** The file name the server sent (Content-Disposition), else the fallback. */
export function blobFileName(res: AxiosResponse, fallback: string): string {
  const disposition = String(res.headers['content-disposition'] ?? '')
  const star = disposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i)
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''))
    } catch {
      /* fall through */
    }
  }
  const plain = disposition.match(/filename="?([^";]+)"?/i)
  return plain ? plain[1].trim() : fallback
}

/** Hands a downloaded Blob to the browser as a file. */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** A readable message for a failed blob download. Errors come back as a JSON
 *  body inside a Blob, so the server's own message is read out of it. */
export async function blobErrorMessage(error: unknown): Promise<string> {
  const res = (error as { response?: { status?: number; data?: unknown } })?.response
  if (!res) {
    return 'No connection. Check your internet and try again.'
  }
  if (res.status === 429) {
    return 'Too many downloads at once. Wait a minute and try again.'
  }
  let message: string | undefined
  if (res.data instanceof Blob) {
    try {
      message = (JSON.parse(await res.data.text()) as { message?: string }).message
    } catch {
      /* not JSON */
    }
  }
  if (res.status === 404) return message || 'Ticket file not found.'
  if (res.status === 401) return 'Your session has ended. Please sign in again.'
  if ((res.status ?? 0) >= 500) return 'Download failed on our side. Please try again in a moment.'
  return message || 'Download failed. Please try again.'
}
