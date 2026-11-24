/* Shared copy for the write paths that are not connected yet.
 *
 * Kept in one place so the wording is identical everywhere, and so that when
 * the endpoints are wired there is a single list of call sites to delete. */

export const WRITE_NOTICE =
  'Saving isn’t wired yet — the endpoint exists but its payload contract hasn’t been verified, so this will not write to production. The form is the shape it will submit.'

export const DELETE_NOTICE =
  'The DELETE endpoint has not been verified, so nothing was removed. Wiring it needs a confirmed contract first — deleting the wrong thing is not a mistake you can undo.'
