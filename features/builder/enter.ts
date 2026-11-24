import {
  useTicketQuantity,
  quantityToParams,
  type QuantityChoice,
} from "@/store/ticket-quantity";

/* Minimal router shape — matches next/navigation's useRouter().push. */
type PushRouter = { push: (href: string) => void };

/* Entry point into the matchday builder. Mirrors golafly builder.html's
   startPurchase(match): remember the picked match and open the Seats step.
   The id is carried both in the URL (?match=<id>, shareable) and in
   sessionStorage (survives a hard refresh of the builder steps). */
export const BUILDER_MATCH_KEY = "gfb_selectedMatch";
export const BUILDER_START = "/builder/seats";

export function rememberBuilderMatch(id: string) {
  try {
    window.sessionStorage.setItem(BUILDER_MATCH_KEY, id);
  } catch {
    /* private mode / quota — the ?match= param still carries it */
  }
}

export function readRememberedBuilderMatch(): string | null {
  try {
    return window.sessionStorage.getItem(BUILDER_MATCH_KEY);
  } catch {
    return null;
  }
}

/** Seats-step href carrying the match and the buyer's quantity choice. */
export function seatsHref(id: string, choice?: QuantityChoice): string {
  const usp = new URLSearchParams({ match: id });
  if (choice) {
    for (const [k, v] of Object.entries(quantityToParams(choice))) usp.set(k, v);
  }
  return `${BUILDER_START}?${usp.toString()}`;
}

/** Navigate into the builder for a given match id.
 *
 *  Asks "How many tickets do you need?" first (components/tickets/
 *  ticket-quantity-dialog.tsx), so the seats page opens already filtered
 *  to listings that can sell that many — the buyer never has to pick a
 *  quantity on the seats page itself. Falls back to opening the seats
 *  page directly if the dialog isn't mounted, or when `skipQuantity` is
 *  passed (e.g. coming back from the cart). */
export function enterBuilder(
  router: PushRouter,
  id: string,
  opts?: { skipQuantity?: boolean; title?: string },
) {
  rememberBuilderMatch(id);
  const store = useTicketQuantity.getState();
  if (!opts?.skipQuantity && typeof window !== "undefined" && store.mounted) {
    store.open({
      matchId: id,
      title: opts?.title,
      onContinue: (choice) => router.push(seatsHref(id, choice)),
    });
    return;
  }
  router.push(builderStepHref(BUILDER_START, id));
}

/** Build a builder-step href that carries the selected match forward. */
export function builderStepHref(path: string, id: string | null | undefined): string {
  return id ? `${path}?match=${encodeURIComponent(id)}` : path;
}
