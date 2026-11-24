'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Panel } from '@/components/admin/admin-ui'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { useUpdateVipSettings, useVipSettings } from '@/features/admin/vip/hooks'
import type { VipAdminMode, VipAdminSettingsPatch } from '@/features/admin/vip/types'
import { extractApiMessage } from '@/features/admin/hooks'
import { cn } from '@/lib/utils'
import { instantText } from './shared'

/* "VIP packages for customers" (Admin API contract of 17 Nov, §1.3): the
 * on/off switch and the mode, GET/PATCH /v1/admin/hospitality/settings.
 *  • Off: every customer VIP page is hidden and an unpaid package can't
 *    check out. Paid packages finish normally; this admin keeps working.
 *  • Mode applies to packages created afterwards; packages already being
 *    built keep theirs.
 * Every change is confirmed first, and only shown once the backend saved
 * it. Full admins only: anyone else gets a 403 and sees it read-only. */

const MODES: { value: VipAdminMode; label: string; body: string }[] = [
  {
    value: 'package',
    label: 'Package',
    body: 'Ticket, flight and hotel are all required; the eSIM is optional.',
  },
  {
    value: 'flexible',
    label: 'Flexible',
    body: 'Only the ticket is required. Flight, hotel and eSIM are each optional (a hotel without a flight: the customer picks the dates).',
  },
]

function statusOf(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status
}

export function VipSettingsPanel() {
  const query = useVipSettings()
  const save = useUpdateVipSettings()
  const [pending, setPending] = useState<VipAdminSettingsPatch | null>(null)

  const settings = query.data?.data
  const forbidden = statusOf(query.error) === 403 || statusOf(save.error) === 403

  if (query.isPending) {
    return (
      <Panel title='VIP packages for customers'>
        <p className='m-0 text-xs text-muted-foreground'>Loading…</p>
      </Panel>
    )
  }
  if (!settings) {
    return (
      <Panel title='VIP packages for customers'>
        <p className='m-0 text-xs text-destructive'>
          {statusOf(query.error) === 403
            ? 'Only full admins can see or change this switch.'
            : `Could not load the VIP switch. ${extractApiMessage(query.error)}`}
        </p>
      </Panel>
    )
  }

  const confirmText = (p: VipAdminSettingsPatch) => {
    if (p.enabled === true)
      return {
        title: 'Switch VIP packages on?',
        body: 'Customers will see the VIP pages and can build and pay for packages. The hospitality markup must have all six categories, or prices fail.',
        label: 'Switch on',
        destructive: false,
      }
    if (p.enabled === false)
      return {
        title: 'Switch VIP packages off?',
        body: 'Every customer VIP page is hidden at once, and unpaid packages can no longer check out. Packages already paid finish normally.',
        label: 'Switch off',
        destructive: true,
      }
    const mode = MODES.find((m) => m.value === p.mode)
    return {
      title: `Use ${mode?.label.toLowerCase()} mode?`,
      body: `${mode?.body} Only packages created from now on use it; packages already being built keep their mode.`,
      label: `Use ${mode?.label.toLowerCase()} mode`,
      destructive: false,
    }
  }

  const dialog = pending ? confirmText(pending) : null
  const busy = save.isPending

  return (
    <Panel
      title='VIP packages for customers'
      subtitle={
        settings.enabled
          ? `On · ${settings.mode === 'flexible' ? 'flexible' : 'package'} mode for new packages`
          : 'Off · customers see no VIP pages'
      }
    >
      {/* The on/off switch: its own row, first, so it can't be missed. */}
      <div
        className={cn(
          'mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md p-3',
          settings.enabled
            ? 'bg-brand/10 shadow-[0_0_0_1.5px_var(--primary)]'
            : 'bg-muted/40 shadow-[0_0_0_1px_var(--edge)]',
        )}
      >
        <div className='min-w-0'>
          <p className='m-0 text-[13px] font-semibold'>
            VIP packages are {settings.enabled ? 'ON' : 'OFF'}
          </p>
          <p className='m-0 mt-0.5 text-[11px] leading-relaxed text-muted-foreground'>
            {settings.enabled
              ? 'Customers can see the VIP pages and build and pay for packages.'
              : 'Customers see no VIP pages. Set the hospitality markup (all six categories) before switching on.'}
          </p>
        </div>
        <button
          type='button'
          role='switch'
          aria-checked={settings.enabled}
          aria-label={settings.enabled ? 'Switch off VIP packages' : 'Switch on VIP packages'}
          disabled={busy || forbidden}
          onClick={() => setPending({ enabled: !settings.enabled })}
          className='flex shrink-0 items-center gap-2.5 rounded-full py-1 pl-1 pr-3 text-[12.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-60'
        >
          <span
            className={cn(
              'relative h-[24px] w-[44px] shrink-0 rounded-full transition-colors',
              settings.enabled
                ? 'bg-brand shadow-[0_0_0_1px_var(--brand-edge)]'
                : 'bg-muted shadow-[0_0_0_1px_var(--edge)]',
            )}
          >
            <span
              className={cn(
                'absolute top-[2px] size-[20px] rounded-full bg-card shadow-sm transition-all',
                settings.enabled ? 'left-[22px]' : 'left-[2px]',
              )}
            />
          </span>
          {busy ? (
            <Loader2 className='size-3.5 animate-spin' />
          ) : settings.enabled ? (
            'On'
          ) : (
            'Off'
          )}
        </button>
      </div>

      <p className='m-0 mb-2 font-mono text-[10.5px] uppercase tracking-widest text-muted-foreground'>
        Mode for new packages
      </p>
      <div role='radiogroup' aria-label='VIP package mode' className='grid gap-2 sm:grid-cols-2'>
        {MODES.map((m) => {
          const on = settings.mode === m.value
          return (
            <label
              key={m.value}
              className={cn(
                'flex cursor-pointer items-start gap-2.5 rounded-md p-2.5 shadow-[0_0_0_1px_var(--edge)]',
                on && 'shadow-[0_0_0_1.5px_var(--primary)]',
                (busy || forbidden) && 'cursor-not-allowed opacity-70',
              )}
            >
              <input
                type='radio'
                name='vip-mode'
                value={m.value}
                checked={on}
                disabled={busy || forbidden}
                onChange={() => !on && setPending({ mode: m.value })}
                className='mt-0.5 size-4 shrink-0 accent-primary'
              />
              <span className='min-w-0'>
                <span className='block text-[13px] font-semibold'>{m.label}</span>
                <span className='mt-0.5 block text-[11px] leading-relaxed text-muted-foreground'>{m.body}</span>
              </span>
            </label>
          )
        })}
      </div>
      <p className='m-0 mt-3 text-[11px] leading-relaxed text-muted-foreground'>
        VIP hotels and eSIMs use the hotel and eSIM providers switched on in Settings → Providers. The public site shows or
        hides VIP within about a minute of a change (reload the page).
        {settings.updated_at ? ` Last changed ${instantText(settings.updated_at)}` : ''}
        {settings.updated_by_admin_id ? ` by admin #${settings.updated_by_admin_id}.` : settings.updated_at ? '.' : ''}
      </p>
      {forbidden && (
        <p className='m-0 mt-2 text-[11px] text-destructive'>Only full admins can change this switch.</p>
      )}
      {save.isError && !forbidden && (
        <p className='m-0 mt-2 text-[11px] text-destructive'>
          The change was not saved: {extractApiMessage(save.error)}
        </p>
      )}

      {dialog && pending && (
        <ConfirmDialog
          title={dialog.title}
          body={dialog.body}
          confirmLabel={dialog.label}
          destructive={dialog.destructive}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            const body = pending
            setPending(null)
            save.mutate(body)
          }}
        />
      )}
    </Panel>
  )
}
