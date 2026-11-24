'use client'

import { useState } from 'react'
import { CircleAlert, Info, Loader2 } from 'lucide-react'
import { Panel } from '@/components/admin/admin-ui'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { instantText } from '@/components/admin/vip/shared'
import { extractApiMessage } from '@/features/admin/hooks'
import { esimProviderLabel } from '@/features/esim/types'
import { useAdminFreeEsim, useUpdateAdminFreeEsim } from '@/features/free-esim/hooks'
import { FREE_ESIM_ADMIN_COPY as COPY } from '@/features/free-esim/rules'
import type { FreeEsimScope, UpdateFreeEsimSettings } from '@/features/free-esim/types'
import { cn } from '@/lib/utils'

/* Settings → Free eSIM (Free eSIM contract §3 and §8).
 * GET/PATCH /v1/admin/free-esim/settings. Every save sends BOTH fields.
 * The scope stays editable while the switch is off: it is saved either way
 * and applies when the switch goes on. Each change is confirmed first and is
 * only shown once the backend has saved it. */

const SCOPES: { value: FreeEsimScope; label: string; body: string }[] = [
  {
    value: 'europe',
    label: COPY.scopeEurope,
    body: 'Only matches played in Europe get a free eSIM.',
  },
  {
    value: 'all',
    label: COPY.scopeAll,
    body: 'Every match gets a free eSIM.',
  },
]

function statusOf(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status
}

export function FreeEsimTab() {
  const query = useAdminFreeEsim()
  const save = useUpdateAdminFreeEsim()
  const [pending, setPending] = useState<UpdateFreeEsimSettings | null>(null)

  const settings = query.data?.data
  const forbidden = statusOf(query.error) === 403 || statusOf(save.error) === 403

  if (query.isPending) {
    return (
      <Panel title={COPY.switchLabel}>
        <p className='m-0 text-xs text-muted-foreground'>Loading…</p>
      </Panel>
    )
  }
  if (!settings) {
    const status = statusOf(query.error)
    return (
      <Panel title={COPY.switchLabel}>
        <p className='m-0 text-xs text-destructive'>
          {status === 403
            ? 'Only admins can see or change this switch.'
            : status === 404 || status === 405
              ? 'The free eSIM settings are not available on this server yet (GET /v1/admin/free-esim/settings).'
              : `Could not load the free eSIM settings. ${extractApiMessage(query.error)}`}
        </p>
      </Panel>
    )
  }

  const busy = save.isPending
  const scopeLabel = SCOPES.find((s) => s.value === settings.scope)?.label ?? settings.scope

  const dialogFor = (p: UpdateFreeEsimSettings) => {
    if (p.is_enabled !== settings.is_enabled) {
      return p.is_enabled
        ? {
            title: 'Switch the free eSIM on?',
            body: `Every match-ticket order confirmed from now on (${scopeLabel.toLowerCase()}) gets one free 1 GB / 7 day eSIM by email. Older orders don't get one.`,
            label: 'Switch on',
            destructive: false,
          }
        : {
            title: 'Switch the free eSIM off?',
            body: 'Orders confirmed from now on get no free eSIM, and the offer disappears from the match and checkout pages. eSIMs already sent keep working.',
            label: 'Switch off',
            destructive: true,
          }
    }
    const next = SCOPES.find((s) => s.value === p.scope)
    return {
      title: `Change to "${next?.label}"?`,
      body: settings.is_enabled
        ? `${next?.body} This applies to orders confirmed from now on.`
        : `${next?.body} Saved now; it applies when the switch is turned on.`,
      label: 'Save',
      destructive: false,
    }
  }

  const dialog = pending ? dialogFor(pending) : null

  return (
    <div className='grid gap-3 xl:grid-cols-2'>
      <Panel
        title={COPY.switchLabel}
        subtitle={
          settings.is_available
            ? `Live · ${scopeLabel}`
            : settings.is_enabled
              ? 'On, but not sending: no eSIM provider is switched on'
              : 'Off · no free eSIMs are sent'
        }
      >
        {/* The on/off switch: its own row, first. */}
        <div
          className={cn(
            'mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md p-3',
            settings.is_enabled
              ? 'bg-brand/10 shadow-[0_0_0_1.5px_var(--primary)]'
              : 'bg-muted/40 shadow-[0_0_0_1px_var(--edge)]',
          )}
        >
          <div className='min-w-0'>
            <p className='m-0 text-[13px] font-semibold'>
              {COPY.switchLabel}: {settings.is_enabled ? 'ON' : 'OFF'}
            </p>
            <p className='m-0 mt-0.5 text-[11px] leading-relaxed text-muted-foreground'>
              {settings.is_enabled
                ? 'Each confirmed match-ticket order gets one free 1 GB / 7 day eSIM by email.'
                : 'No free eSIMs are sent and the offer is not shown to customers.'}
            </p>
          </div>
          <button
            type='button'
            role='switch'
            aria-checked={settings.is_enabled}
            aria-label={settings.is_enabled ? 'Switch off the free eSIM' : 'Switch on the free eSIM'}
            disabled={busy || forbidden}
            onClick={() => setPending({ is_enabled: !settings.is_enabled, scope: settings.scope })}
            className='flex shrink-0 items-center gap-2.5 rounded-full py-1 pl-1 pr-3 text-[12.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-60'
          >
            <span
              className={cn(
                'relative h-[24px] w-[44px] shrink-0 rounded-full transition-colors',
                settings.is_enabled
                  ? 'bg-brand shadow-[0_0_0_1px_var(--brand-edge)]'
                  : 'bg-muted shadow-[0_0_0_1px_var(--edge)]',
              )}
            >
              <span
                className={cn(
                  'absolute top-[2px] size-[20px] rounded-full bg-card shadow-sm transition-all',
                  settings.is_enabled ? 'left-[22px]' : 'left-[2px]',
                )}
              />
            </span>
            {busy ? <Loader2 className='size-3.5 animate-spin' /> : settings.is_enabled ? 'On' : 'Off'}
          </button>
        </div>

        {!settings.provider_active && (
          <p
            role='status'
            className='m-0 mb-3 flex items-start gap-2 rounded-md bg-status-warn-bg px-3 py-2 text-[11.5px] text-status-warn'
          >
            <CircleAlert className='mt-0.5 size-3.5 shrink-0' />
            {COPY.noProvider}
          </p>
        )}

        <p className='m-0 mb-2 font-mono text-[10.5px] uppercase tracking-widest text-muted-foreground'>
          {COPY.scopeLabel}
        </p>
        <div role='radiogroup' aria-label={COPY.scopeLabel} className='grid gap-2 sm:grid-cols-2'>
          {SCOPES.map((s) => {
            const on = settings.scope === s.value
            return (
              <label
                key={s.value}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 rounded-md p-2.5 shadow-[0_0_0_1px_var(--edge)]',
                  on && 'shadow-[0_0_0_1.5px_var(--primary)]',
                  (busy || forbidden) && 'cursor-not-allowed opacity-70',
                )}
              >
                <input
                  type='radio'
                  name='free-esim-scope'
                  value={s.value}
                  checked={on}
                  disabled={busy || forbidden}
                  onChange={() => !on && setPending({ is_enabled: settings.is_enabled, scope: s.value })}
                  className='mt-0.5 size-4 shrink-0 accent-primary'
                />
                <span className='min-w-0'>
                  <span className='block text-[13px] font-semibold'>{s.label}</span>
                  <span className='mt-0.5 block text-[11px] leading-relaxed text-muted-foreground'>{s.body}</span>
                </span>
              </label>
            )
          })}
        </div>

        <p className='m-0 mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground'>
          <Info className='mt-0.5 size-3 shrink-0' />
          {COPY.vipNote}
        </p>

        {forbidden && (
          <p className='m-0 mt-2 text-[11px] text-destructive'>Only admins can change this switch.</p>
        )}
        {save.isError && !forbidden && (
          <p className='m-0 mt-2 text-[11px] text-destructive'>
            The change was not saved: {extractApiMessage(save.error)}
          </p>
        )}
      </Panel>

      <Panel title='How it works'>
        <dl className='m-0 flex flex-col text-[12px]'>
          {[
            ['eSIM provider', settings.provider_active ? esimProviderLabel(settings.active_provider) : 'None switched on'],
            ['Free eSIMs going out', settings.is_available ? 'Yes' : 'No'],
            ['Switched on since', settings.enabled_at ? instantText(settings.enabled_at) : '—'],
            [
              'Last changed',
              settings.updated_at
                ? `${instantText(settings.updated_at)}${settings.updated_by_admin_id ? ` by admin #${settings.updated_by_admin_id}` : ''}`
                : 'Never saved',
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className='flex items-start justify-between gap-4 border-b border-[var(--edge)] py-2 last:border-b-0'
            >
              <dt className='text-muted-foreground'>{label}</dt>
              <dd className='m-0 text-right font-medium text-foreground'>{value}</dd>
            </div>
          ))}
        </dl>
        <ul className='m-0 mt-3 flex list-disc flex-col gap-1 pl-4 text-[11px] leading-relaxed text-muted-foreground'>
          <li>The backend sends the free eSIM by itself when a match-ticket order is confirmed: one per order, on top of any eSIM the customer buys.</li>
          <li>Only orders confirmed after the switch was last turned on get one. Turning it on does not give free eSIMs to older orders.</li>
          <li>If one can&apos;t be sent (unknown country, no 1 GB / 7 day package, provider error) the team is emailed; the customer isn&apos;t told and the ticket order is unaffected.</li>
          <li>The eSIM provider is chosen in Settings → Providers.</li>
        </ul>
      </Panel>

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
    </div>
  )
}
