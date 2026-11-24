// gifenc ships no types; only the two palette helpers used by
// lib/email/countdown.tsx are declared.
declare module 'gifenc' {
  export type Palette = number[][]
  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, options?: Record<string, unknown>): Palette
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette, format?: string): Uint8Array
}
