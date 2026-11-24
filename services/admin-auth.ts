import golaflyAxios from '@/services/golafly-axios'
import type { ApiResponse } from '@/services/programs'

export interface AdminUser {
  id: number
  name: string
  email: string
  role: string
  created_at: string
  updated_at: string
}

export interface AdminLoginRequest {
  email: string
  password: string
}

export interface AdminLoginData {
  admin: AdminUser
  token: string
  expires_in: number
}

export interface UpdateAdminProfileRequest {
  name: string
  email: string
}

export interface UpdateAdminPasswordRequest {
  current_password: string
  password: string
  password_confirmation: string
}

export type AdminLoginResponse = ApiResponse<AdminLoginData>
export type AdminMeResponse = ApiResponse<{ admin: AdminUser }>
export type AdminRefreshResponse = ApiResponse<{ token: string; expires_in: number }>
export type AdminLogoutResponse = ApiResponse<null>
export type AdminProfileResponse = ApiResponse<{ admin: AdminUser }>

/**
 * Admin authentication against the Golafly backend. Same endpoints the Golafly
 * frontend's AuthService used — this is the same API, so the contract is not
 * being invented here.
 *
 * Token handling lives in features/admin/session.ts; the Bearer header is
 * attached by the golaflyAxios request interceptor, so nothing here has to
 * know about cookies.
 */
export class AdminAuthService {
  public static async login(payload: AdminLoginRequest): Promise<AdminLoginResponse> {
    const response = await golaflyAxios.post<AdminLoginResponse>(
      '/v1/auth/admin/login',
      payload,
      { headers: { Accept: 'application/json' } },
    )
    return response.data
  }

  public static async me(): Promise<AdminMeResponse> {
    const response = await golaflyAxios.get<AdminMeResponse>('/v1/auth/admin/me', {
      headers: { Accept: 'application/json' },
    })
    return response.data
  }

  public static async logout(): Promise<AdminLogoutResponse> {
    const response = await golaflyAxios.post<AdminLogoutResponse>(
      '/v1/auth/logout',
      {},
      { headers: { Accept: 'application/json' } },
    )
    return response.data
  }

  public static async updateProfile(
    payload: UpdateAdminProfileRequest,
  ): Promise<AdminProfileResponse> {
    const response = await golaflyAxios.patch<AdminProfileResponse>(
      '/v1/auth/admin/profile',
      payload,
      { headers: { Accept: 'application/json' } },
    )
    return response.data
  }

  public static async updatePassword(
    payload: UpdateAdminPasswordRequest,
  ): Promise<AdminProfileResponse> {
    const response = await golaflyAxios.patch<AdminProfileResponse>(
      '/v1/auth/admin/password',
      payload,
      { headers: { Accept: 'application/json' } },
    )
    return response.data
  }
}
