// features/vip/config.ts

/** Colour of the site's own header, footer and floating buttons (Sign in,
 *  cart count, "Back to top", "Get in touch", app-install prompt) while a
 *  VIP page is open.
 *    NEXT_PUBLIC_VIP_GOLD_SITE_CHROME=true  → VIP gold
 *    anything else / not set                → Golafly lime (as in Figma)
 *  Read when the site is built: change it, then restart `pnpm dev` or
 *  rebuild. The VIP pages' own content is gold either way. */
export const VIP_GOLD_SITE_CHROME =
  process.env.NEXT_PUBLIC_VIP_GOLD_SITE_CHROME === 'true'
