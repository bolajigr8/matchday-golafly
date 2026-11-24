"use client";

import { TriangleAlert } from "lucide-react";
import { AdminButton } from "@/components/admin/admin-ui";

/* Dialogs are for decisions only — never for forms, which are sheets.
 *
 * The confirm button NAMES the action ("Delete offer"), never "OK", so the
 * button alone is unambiguous if the title was skimmed. Destructive confirms
 * also name the entity being destroyed, because "Are you sure?" on a table row
 * is how the wrong row gets deleted. */

interface ConfirmDialogProps {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="fixed inset-0 z-40 bg-foreground/30"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card shadow-[0_0_0_1px_var(--edge-strong),var(--lift-3)]"
      >
        <div className="flex items-start gap-2.5 p-4">
          <span
            className={
              destructive
                ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-destructive shadow-[0_0_0_1px_color-mix(in_oklch,var(--destructive)_40%,transparent)]"
                : "flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-[0_0_0_1px_var(--edge)]"
            }
          >
            <TriangleAlert className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13.5px] font-semibold">{title}</span>
            <span className="mt-1 block text-[11.5px] leading-relaxed text-muted-foreground">
              {body}
            </span>
          </span>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--edge)] p-3">
          <AdminButton variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </AdminButton>
          <AdminButton
            variant={destructive ? "destructive" : "primary"}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </AdminButton>
        </div>
      </div>
    </>
  );
}
