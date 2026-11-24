'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { isVipPath } from '@/features/vip/routes'
import { VIP_GOLD_SITE_CHROME } from '@/features/vip/config'

/* Keeps the `vip-theme` class on <html> in step with the address: on while a
   VIP page (/vip, /vip/…) is open, off everywhere else. The class turns the
   site's lime brand colour into VIP gold (app/globals.css). The first page
   load is handled before paint by vipThemeBootScript in app/layout.tsx; this
   covers moving between pages without a reload. Switched off (always lime)
   unless NEXT_PUBLIC_VIP_GOLD_SITE_CHROME=true (features/vip/config.ts). */
export function VipThemeClass() {
  const pathname = usePathname()
  useEffect(() => {
    document.documentElement.classList.toggle(
      'vip-theme',
      VIP_GOLD_SITE_CHROME && isVipPath(pathname),
    )
  }, [pathname])
  return null
}
