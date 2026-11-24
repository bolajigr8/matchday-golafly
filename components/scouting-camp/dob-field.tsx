"use client";

import { DatePicker } from "@/components/ui/date-picker";

/* Date of birth for the camp form: the site's calendar picker, sitting in the
 * form's own box (.sc-box). Takes and gives "YYYY-MM-DD". */
export function CampDobField({ id, value, onChange }: { id: string; value: string; onChange: (iso: string) => void }) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return (
    <div id={id} tabIndex={-1} className="sc-box flex items-center px-3.5">
      <DatePicker
        value={value}
        onChange={onChange}
        max={today}
        defaultMonth={`${now.getFullYear() - 18}-01-01`}
        placeholder="Select date"
        dark
      />
    </div>
  );
}
