import axiosInstance from '@/lib/axios'

export interface Coupon {
  id: number
  label: string
  code: string
  value: number
  expires_in_days: number
  expires_at: string
  is_expired: boolean
  days_remaining: number
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export async function validateCoupon(code: string): Promise<ApiResponse<Coupon>> {
  const { data } = await axiosInstance.post<ApiResponse<Coupon>>(
    '/api/v1/discounts/validate',
    { code },
  )
  return data
}
