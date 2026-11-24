import golaflyAxios from '@/services/golafly-axios'
import type { ApiResponse } from '@/services/programs'

/**
 * Golafly API merchants — the businesses that sell Golafly flights and eSIMs
 * through the API (the golafly-merchant portal). Postman: "merchants / admin".
 *
 * Five admin endpoints, all on golaflyAxios (admin bearer token):
 *   GET  /v1/merchant               list
 *   POST /v1/merchant               create (approved and verified at once)
 *   GET  /v1/merchant/{id}          show
 *   POST /v1/merchant/{id}/approve  approve a pending or disabled merchant
 *   POST /v1/merchant/{id}/disable  disable an approved one
 *
 * Every one answers with the whole merchant (or a list of them), so a write
 * can seed the detail cache from its own response.
 */

export type MerchantStatus = 'pending' | 'approved' | 'disabled'

export type MerchantDocumentKey =
  | 'cac_certificate'
  | 'cac_status_report'
  | 'director_id'
  | 'utility_bill'
  | 'bank_statement'
  | 'tin_certificate'
  | 'iata_licence'

export interface ApiMerchant {
  id: number
  /** "MCH-0005" */
  partner_code: string
  owner: {
    id: string
    name: string
    email: string
    role: string
    email_verified_at: string | null
  }
  business_name: string
  phone: string
  business_address: string
  city: string | null
  state: string | null
  rc_number: string | null
  cac_number: string | null
  director_name: string | null
  director_bvn: string | null
  /** Decimal strings in `currency`: live wallet and sandbox wallet. */
  balance: string
  test_balance: string
  currency: string
  base_url: string
  test_url: string
  status: MerchantStatus
  setting: {
    website: string | null
    timezone: string
    two_factor_enabled: boolean
    low_balance_alert_amount: string
    auto_pause_when_balance_zero: boolean
    environment: 'live' | 'test'
    webhook_url: string | null
    webhook_events: string[]
    /** Masked by the API. */
    webhook_secret: string
    flight_commission_percent: string
    esim_commission_percent: string
    documents: Partial<Record<MerchantDocumentKey, { uploaded: boolean; url: string | null }>>
  }
  created_at: string
  updated_at: string
}

export interface CreateMerchantPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  business_name: string
  phone: string
  business_address: string
}

export type MerchantsResponse = ApiResponse<ApiMerchant[]>
export type MerchantResponse = ApiResponse<ApiMerchant>

const json = { headers: { Accept: 'application/json' } }

export class MerchantsAdminService {
  public static async getMerchants(): Promise<MerchantsResponse> {
    const response = await golaflyAxios.get<MerchantsResponse>('/v1/merchant', json)
    return response.data
  }

  public static async getMerchantById(id: number): Promise<MerchantResponse> {
    const response = await golaflyAxios.get<MerchantResponse>(`/v1/merchant/${id}`, json)
    return response.data
  }

  public static async createMerchant(payload: CreateMerchantPayload): Promise<MerchantResponse> {
    const response = await golaflyAxios.post<MerchantResponse>('/v1/merchant', payload, json)
    return response.data
  }

  public static async approveMerchant(id: number): Promise<MerchantResponse> {
    const response = await golaflyAxios.post<MerchantResponse>(`/v1/merchant/${id}/approve`, undefined, json)
    return response.data
  }

  public static async disableMerchant(id: number): Promise<MerchantResponse> {
    const response = await golaflyAxios.post<MerchantResponse>(`/v1/merchant/${id}/disable`, undefined, json)
    return response.data
  }
}
