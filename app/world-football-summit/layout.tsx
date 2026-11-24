import type { ReactNode } from 'react'

/* Every World Football Summit page sits inside `.wfs`: the summit's own
   colours (app/globals.css) and Figma's default line height. */
export default function SummitLayout({ children }: { children: ReactNode }) {
  return <div className='wfs bg-wfs-page leading-[normal] text-wfs-text'>{children}</div>
}
