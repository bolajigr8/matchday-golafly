'use client'

import { toast } from 'sonner'
import { Panel } from '@/components/admin/admin-ui'
import { SwitchInput } from '@/components/admin/form-controls'
import {
  useAdminEsimProviders,
  useToggleEsimProvider,
} from '@/features/admin/hooks'
import type { EsimProvider } from '@/services/travel-admin'
import { StaysProvidersPanel } from './stays-providers-panel'

export function ProvidersTab() {
  return (
    <div className='flex flex-col gap-3'>
      <EsimProvidersPanel />
      <StaysProvidersPanel />
    </div>
  )
}

/**
 * Same rule as TravelsBackend: activating a provider turns the others off.
 * Only Airalo and LimitFlex can actually sell; eSIM Access is listed so the
 * admin can see it, but the catalogue endpoint refuses it until it is built.
 */
function EsimProvidersPanel() {
  const query = useAdminEsimProviders()
  const toggle = useToggleEsimProvider()

  const providers = [...(query.data?.data ?? [])].sort(
    (a, b) => a.display_order - b.display_order,
  )
  const active = providers.find((provider) => provider.enabled)

  const handleActivate = (provider: EsimProvider) => {
    if (toggle.isPending) return
    if (provider.enabled) {
      toast.message(`${provider.name} is already the active provider`)
      return
    }
    toggle.mutate(provider.id)
  }

  if (query.isPending) {
    return (
      <Panel title='eSIM providers'>
        <p className='m-0 text-xs text-muted-foreground'>Loading providers…</p>
      </Panel>
    )
  }

  if (query.isError) {
    return (
      <Panel title='eSIM providers'>
        <p className='m-0 text-xs text-destructive'>
          Could not load providers. GET /v1/esim-providers failed.
        </p>
      </Panel>
    )
  }

  return (
    <Panel
      title='eSIM providers'
      subtitle={
        active
          ? `${active.name} is live · packages and checkout use this supplier`
          : 'No provider is active'
      }
    >
      {providers.length === 0 ? (
        <p className='m-0 text-xs text-muted-foreground'>
          No providers configured.
        </p>
      ) : (
        <ul className='m-0 flex list-none flex-col p-0'>
          {providers.map((provider) => (
            <li
              key={provider.id}
              className='flex items-center justify-between gap-3 border-b border-[var(--edge)] py-2.5 first:pt-0 last:border-0 last:pb-0'
            >
              <div className='min-w-0'>
                <p className='m-0 truncate text-[13px] font-semibold'>
                  {provider.name}
                </p>
                <p className='m-0 mt-0.5 truncate font-mono text-[10.5px] text-muted-foreground'>
                  {provider.slug}
                </p>
              </div>
              <SwitchInput
                value={provider.enabled}
                onChange={() => handleActivate(provider)}
                onLabel='Active'
                offLabel='Use this'
              />
            </li>
          ))}
        </ul>
      )}
      <p className='m-0 mt-3 text-[11px] leading-relaxed text-muted-foreground'>
        One provider is live at a time. Airalo and LimitFlex can sell. eSIM
        Access is listed but not implemented — activating it stops the catalogue
        until you switch back. Existing orders stay with the supplier they were
        placed on.
      </p>
    </Panel>
  )
}
