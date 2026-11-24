import type { ReactNode } from 'react'
import { VipFlowFooter } from './flow-footer'
import { VipFlowHeader } from './flow-header'

/* Shell of every VIP booking-flow page (match, builder steps, confirmed).
   The site header and footer are switched off on these paths (see
   isVipFlowPath), so this brings the VIP builder header and footer.
   leading-[normal]: Figma's default line height (same as /vip). */
export function VipFlowShell({ children }: { children: ReactNode }) {
  return (
    <div className='flex min-h-screen flex-col bg-vip-ink leading-[normal] text-vip-fg'>
      <VipFlowHeader />
      <main className='flex-1'>{children}</main>
      <VipFlowFooter />
    </div>
  )
}
