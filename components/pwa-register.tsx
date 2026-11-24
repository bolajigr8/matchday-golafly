'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { currentSiteKey } from '@/lib/site-runtime'

/* Registers the service worker (public/sw.js).
 *
 * Production and golafly.com only:
 *   - not in `next dev`, where a worker caching build files gets in the way;
 *   - not on the landing hostnames (championsleague.golafly.com …): each is
 *     its own site with its own cart, and those are ad pages that should not
 *     turn into an installed app.
 *
 * Renders nothing. When a new version of the worker is waiting, a toast asks
 * the visitor to refresh instead of swapping the page under them. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    if (currentSiteKey()) return

    let reloading = false
    const onControllerChange = () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    }

    const promptUpdate = (worker: ServiceWorker) => {
      toast('A new version of Golafly Matchday is available.', {
        id: 'pwa-update',
        duration: Infinity,
        action: {
          label: 'Refresh',
          onClick: () => worker.postMessage({ type: 'SKIP_WAITING' }),
        },
      })
    }

    let timer: ReturnType<typeof setInterval> | undefined
    let registration: ServiceWorkerRegistration | undefined

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

        // A worker that was already waiting when the page opened.
        if (registration.waiting && navigator.serviceWorker.controller) {
          promptUpdate(registration.waiting)
        }

        registration.addEventListener('updatefound', () => {
          const incoming = registration?.installing
          if (!incoming) return
          incoming.addEventListener('statechange', () => {
            // "installed" with a controller = an update, not the first install.
            if (incoming.state === 'installed' && navigator.serviceWorker.controller) {
              promptUpdate(incoming)
            }
          })
        })

        // Look for a new worker now and then, and when the tab comes back.
        timer = setInterval(() => registration?.update().catch(() => {}), 60 * 60 * 1000)
      } catch {
        // Registration is an enhancement; the site works without it.
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') registration?.update().catch(() => {})
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    document.addEventListener('visibilitychange', onVisible)
    if (document.readyState === 'complete') void register()
    else window.addEventListener('load', register, { once: true })

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('load', register)
      if (timer) clearInterval(timer)
    }
  }, [])

  return null
}
