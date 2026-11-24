"use client";

import { useContext, useState } from "react";
import { Lock } from "lucide-react";
import { AdminNavContext } from "@/components/admin/admin-nav-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TemplateSource } from "@/components/scout/scout-states";
import { SCORE_MAX, SCORE_MIN } from "@/features/scout/evaluation";
import {
  TEMPLATES,
  TEMPLATE_ORDER,
  positionsUsing,
  templateFieldCount,
  type TemplateId,
} from "@/features/scout/templates";
import { cn } from "@/lib/utils";

/* TEMPLATES — GOL-SCOUT-25, the scout's read-only view (design card 17).
 *
 * Template list on the left, the chosen template on the right: who it applies
 * to, then its attributes as chips, group by group. Hardcoded in
 * features/scout/templates.ts; each evaluation uses the template for the
 * player's primary position. */
export default function TemplatesClient() {
  const { openNav } = useContext(AdminNavContext);
  const [activeId, setActiveId] = useState<TemplateId>(TEMPLATE_ORDER[0]);
  const active = TEMPLATES[activeId];
  const applies = positionsUsing(activeId);

  return (
    <>
      <AdminPageHeader
        onOpenNav={openNav}
        crumbs={["Scouting", "Templates"]}
        title="Position templates"
        stats={[{ label: `${TEMPLATE_ORDER.length} templates` }]}
      />

      <div className="flex-1 px-4 pb-6 pt-3 lg:px-[18px]">
        <div className="grid gap-3 lg:grid-cols-[240px_1fr]">
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-card p-2 shadow-[0_0_0_1px_var(--edge),var(--lift-1)] lg:flex-col lg:overflow-visible">
            {TEMPLATE_ORDER.map(id => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveId(id)}
                className={cn(
                  "flex shrink-0 items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-[12px] transition-colors",
                  id === activeId ? "bg-muted font-semibold" : "hover:bg-accent",
                )}
              >
                <span className="truncate">{TEMPLATES[id].name}</span>
                <span className="shrink-0 font-mono text-[9.5px] text-muted-foreground">
                  {templateFieldCount(TEMPLATES[id])}
                </span>
              </button>
            ))}
          </div>

          <div className="min-w-0 rounded-lg bg-card p-3.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
            <p className="m-0 font-heading text-[16px] font-bold">{active.name}</p>
            <p className="m-0 mt-1 text-[11px] text-muted-foreground">
              {applies.length > 0
                ? `Applies to ${applies.map(p => p.label).join(", ")}`
                : "Applies to players with no recognised position"}
            </p>

            {active.groups.map(g => (
              <div key={g.key}>
                <p className="mt-4 border-b border-[var(--edge)] pb-1.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">
                  {g.label} · scored {SCORE_MIN}–{SCORE_MAX}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {g.fields.map(field => (
                    <span
                      key={field.key}
                      title={field.hint}
                      className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10.5px]"
                    >
                      {field.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-4">
              <TemplateSource>
                <Lock className="mt-px size-3 shrink-0" />
                <span>
                  <b className="text-foreground">Read-only.</b> Every player at a
                  position is scored on the same attributes, so their evaluations
                  stay comparable.
                </span>
              </TemplateSource>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
