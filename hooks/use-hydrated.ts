import { useSyncExternalStore } from 'react'

/** Never emits: the value only changes between the server snapshot and the
 *  client one, and hydration itself already covers that. */
const noSubscribe = () => () => {}
const onClient = () => true
const onServer = () => false

/**
 * `true` once the component has hydrated on the client, `false` during the
 * server render and the first client render.
 *
 * Replaces the `const [mounted, setMounted] = useState(false)` +
 * `useEffect(() => setMounted(true), [])` pattern, which triggers a cascading
 * render and which React flags as impure (`react-hooks/set-state-in-effect`).
 * `useSyncExternalStore` expresses the same thing with neither an effect nor
 * state of its own.
 *
 * Use it for anything that cannot render identically on server and client:
 * reading the resolved theme, portals into `document.body`, measuring the DOM.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noSubscribe, onClient, onServer)
}
