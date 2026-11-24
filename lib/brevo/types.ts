// Ported from travels/lib/brevo/types.ts, with `matchday` (ticket orders)
// added as a fourth product.

export type BrevoProduct = 'flight' | 'stays' | 'esim' | 'matchday'

/** Normalised status across every product. */
export type BrevoOrderStatus =
  | 'created'
  | 'pending'
  | 'paid'
  | 'confirmed'
  | 'failed'
  | 'expired'
  | 'cancelled'

export interface BrevoCustomer {
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
}

export interface BrevoOrderMeta {
  [key: string]: string | number | boolean | undefined
}

export interface SyncOrderPayload {
  product: BrevoProduct
  status: BrevoOrderStatus
  order: {
    id: string | number
    amount: number
    currency: string
    createdAt: string // ISO
    updatedAt: string // ISO
  }
  customer: BrevoCustomer
  meta?: BrevoOrderMeta
}

export interface SyncOrderResult {
  contact: 'ok' | 'error'
  order: 'ok' | 'error'
  event: 'ok' | 'error'
  errors?: Partial<Record<'contact' | 'order' | 'event', string>>
}
