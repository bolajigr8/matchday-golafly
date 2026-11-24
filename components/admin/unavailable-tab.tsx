import { PlugZap } from "lucide-react";
import { EmptyState } from "@/components/admin/admin-ui";

/* For tabs whose backing endpoint does not exist yet.
 *
 * Says so plainly instead of showing a convincing-looking empty table. An
 * empty state implies "there is no data"; this is "there is no endpoint", and
 * conflating the two is how a dashboard quietly lies to the person running the
 * business. */
export function UnavailableTab({ what, detail }: { what: string; detail: string }) {
  return (
    <div className="overflow-hidden rounded-lg bg-card shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
      <EmptyState
        icon={<PlugZap className="size-5" />}
        title={`${what} isn’t available yet`}
        body={detail}
      />
    </div>
  );
}
