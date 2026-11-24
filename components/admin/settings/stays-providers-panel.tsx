'use client'

import { Loader2 } from 'lucide-react'
import { Panel } from '@/components/admin/admin-ui'
import {
  useAdminStaysProviders,
  useSwitchStaysProvider,
} from '@/features/admin/hooks'
import { cn } from '@/lib/utils'

/**
 * Hotel (Stays) provider switch — contract "Citizenship, room name and failed
 * hotel" v1.1, section 5.3/5.4. Exactly one provider is on, so this is a
 * single choice (radio buttons), not two toggles. The radio only moves once
 * the backend confirms; the list is then reloaded from GET /stays-providers.
 */
export function StaysProvidersPanel() {
  const query = useAdminStaysProviders()
  const switchProvider = useSwitchStaysProvider()

  const providers = [...(query.data?.data ?? [])].sort(
    (a, b) => a.display_order - b.display_order,
  )
  const active = providers.find((provider) => provider.enabled)
  const pendingId = switchProvider.isPending ? switchProvider.variables : null

  if (query.isPending) {
    return (
      <Panel title='Hotel providers'>
        <p className='m-0 text-xs text-muted-foreground'>Loading providers…</p>
      </Panel>
    )
  }

  if (query.isError) {
    return (
      <Panel title='Hotel providers'>
        <p className='m-0 text-xs text-destructive'>
          Could not load providers. GET /v1/stays-providers failed.
        </p>
      </Panel>
    )
  }

  return (
    <Panel
      title='Hotel providers'
      subtitle={
        active
          ? `${active.name} is live · hotel search and booking use this supplier`
          : 'No provider is on · customers see "Hotel booking is not available right now"'
      }
    >
      {providers.length === 0 ? (
        <p className='m-0 text-xs text-muted-foreground'>
          No providers configured.
        </p>
      ) : (
        <div
          role='radiogroup'
          aria-label='Hotel provider'
          className='m-0 flex flex-col p-0'
        >
          {providers.map((provider) => {
            const pending = pendingId === provider.id
            return (
              <label
                key={provider.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 border-b border-[var(--edge)] py-2.5 first:pt-0 last:border-0 last:pb-0',
                  switchProvider.isPending && 'cursor-wait opacity-70',
                )}
              >
                <input
                  type='radio'
                  name='stays-provider'
                  value={provider.id}
                  checked={provider.enabled}
                  disabled={switchProvider.isPending}
                  onChange={() => {
                    if (!provider.enabled) switchProvider.mutate(provider.id)
                  }}
                  className='size-4 shrink-0 accent-primary'
                />
                <span className='min-w-0 flex-1'>
                  <span className='m-0 block truncate text-[13px] font-semibold'>
                    {provider.name}
                  </span>
                  <span className='m-0 mt-0.5 block truncate font-mono text-[10.5px] text-muted-foreground'>
                    {provider.slug}
                  </span>
                </span>
                {pending ? (
                  <Loader2 className='size-3.5 shrink-0 animate-spin text-muted-foreground' />
                ) : provider.enabled ? (
                  <span className='shrink-0 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground'>
                    Live
                  </span>
                ) : null}
              </label>
            )
          })}
        </div>
      )}
      <p className='m-0 mt-3 text-[11px] leading-relaxed text-muted-foreground'>
        One provider is live at a time: choosing one switches the other off.
        Customers already part-way through a hotel booking finish it with the
        provider they started with; new searches use the new one. VIP package
        hotels use this switch too: a VIP customer part-way through is asked to
        search again, and a hotel already in a basket keeps its provider.
      </p>
    </Panel>
  )
}
