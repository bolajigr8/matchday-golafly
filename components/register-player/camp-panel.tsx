"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Program, ProgramApplicant, ProgramAvailability } from "@/services/programs";

// ─── Camp panel ───────────────────────────────────────────────────────────────
// Ported from golafly.com (components/register/camp-panel.tsx) so the two
// registration pages show a program the same way. Desktop: a sticky card
// beside the form. Below 1000px: CampMobileBar, a one-line bar above the form
// that expands into the same content.

type Props = {
  program?: Program;
  availability?: ProgramAvailability;
  /** Players on the program. Undefined when the list isn't available. */
  applicants?: ProgramApplicant[];
  loading?: boolean;
  primaryPosition: string;
  secondaryPosition: string;
};

const VISIBLE_PLAYERS = 5;

type Tone = "open" | "almost" | "full";
const toneOf = (left: number): Tone => (left <= 0 ? "full" : left <= 3 ? "almost" : "open");
const TONE_TEXT: Record<Tone, string> = {
  open:   "text-[#16a34a] dark:text-[#22c55e]",
  almost: "text-amber-600 dark:text-amber-400",
  full:   "text-red-500",
};
const TONE_STROKE: Record<Tone, string> = {
  open:   "stroke-[#16a34a] dark:stroke-[#22c55e]",
  almost: "stroke-amber-500 dark:stroke-amber-400",
  full:   "stroke-red-500",
};

const applicantName = (a: ProgramApplicant) =>
  [a.payload?.first_name, a.payload?.last_name].filter(Boolean).join(" ") || "Player";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const DAY_YEAR = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const parse = (iso?: string | null) => {
  const d = iso ? new Date(iso.slice(0, 10)) : null;
  return d && !isNaN(d.getTime()) ? d : null;
};

function programDates(p: Program) {
  const s = parse(p.start_date);
  const e = parse(p.end_date);
  if (!s) return "";
  if (!e) return DAY_YEAR.format(s);
  return `${DAY.format(s)} – ${DAY_YEAR.format(e)}`;
}

function spotsLabel(left: number) {
  if (left <= 0) return "Camp full";
  return `${left} spot${left === 1 ? "" : "s"} left`;
}

function CapacityRing({ registered, capacity, tone }: { registered: number; capacity: number; tone: Tone }) {
  const size = 128, stroke = 8, r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const filled = capacity > 0 ? Math.min(1, registered / capacity) : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${registered} of ${capacity} players registered`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
        className="stroke-[rgba(11,13,12,0.08)] dark:stroke-[rgba(245,247,243,0.06)]" />
      {/* Only drawn once something is filled: a zero-length round-capped
          stroke still paints a dot at the top of the ring. */}
      {filled > 0 && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${c * filled} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={`${TONE_STROKE[tone]} transition-[stroke-dasharray] duration-500`} />
      )}
      <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle"
        className="fill-[#1a1e1b] dark:fill-[#f5f7f3] font-bold text-[34px]"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {registered}
      </text>
      <text x="50%" y="66%" textAnchor="middle" dominantBaseline="middle" className="fill-[#6c7668] text-[13px]">
        / {capacity}
      </text>
    </svg>
  );
}

function PositionChips({ primary, secondary }: { primary?: string | null; secondary?: string | null }) {
  return (
    <span className="flex gap-1">
      {[primary, secondary].filter(Boolean).map(p => (
        <span key={p} className="font-mono text-[10.5px] font-medium px-[7px] py-[3px] rounded-[6px]
          bg-[rgba(183,255,0,0.16)] text-[#3f6b00] dark:bg-[rgba(183,255,0,0.10)] dark:text-[#b7ff00]">
          {p}
        </span>
      ))}
    </span>
  );
}

/** Everything inside the card — shared by the desktop panel and the mobile bar. */
function CampContent({ program, availability, applicants, loading, primaryPosition, secondaryPosition, showHeader = true }: Props & { showHeader?: boolean }) {
  const [showAll, setShowAll] = useState(false);

  if (!program) {
    return (
      <p className="py-8 text-center text-[13px] text-[#6c7668]">
        Select a program to see available spots.
      </p>
    );
  }

  const tone = availability ? toneOf(availability.spot_left) : "open";
  const taken = availability ? availability.spot - availability.spot_left : 0;
  const players = applicants ?? [];
  const visible = showAll ? players : players.slice(0, VISIBLE_PLAYERS);
  const meta = [programDates(program), program.location].filter(Boolean).join(" · ");
  const youReady = primaryPosition && secondaryPosition;

  return (
    <>
      {showHeader && (
        <div>
          <p className="font-mono text-[11px] tracking-[1.6px] uppercase text-[#6c7668]">Camp</p>
          <h3 className="mt-2 text-[18px] font-bold leading-snug text-[#1a1e1b] dark:text-[#f5f7f3] text-balance"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {program.title}
          </h3>
          {meta && <p className="mt-1 text-[13px] text-[#6c7668]">{meta}</p>}
        </div>
      )}

      {loading && !availability && (
        <div className="mt-6 h-[180px] rounded-[12px] animate-pulse bg-[rgba(11,13,12,0.04)] dark:bg-[rgba(245,247,243,0.04)]" />
      )}

      {availability && availability.spot > 0 && (
        <>
          <div className="flex flex-col items-center text-center gap-1 pt-7 pb-6 border-b-[0.8px]
            border-[rgba(11,13,12,0.08)] dark:border-[rgba(245,247,243,0.06)]">
            <CapacityRing registered={taken} capacity={availability.spot} tone={tone} />
            <p className={`mt-3 text-[18px] font-bold ${TONE_TEXT[tone]}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {spotsLabel(availability.spot_left)}
            </p>
            <p className="text-[13px] text-[#6c7668]">{taken} player{taken === 1 ? "" : "s"} registered</p>
          </div>

        </>
      )}

      {availability && applicants && (
        <>
          <div className="flex items-baseline justify-between pt-5 pb-1">
            <p className="text-[13px] font-bold tracking-[0.52px] text-[#1a1e1b] dark:text-[#f5f7f3]">
              Registered Players ({players.length})
            </p>
            <p className="text-[12px] text-[#6c7668]">Positions</p>
          </div>

          <ul className="divide-y-[0.8px] divide-[rgba(11,13,12,0.08)] dark:divide-[rgba(245,247,243,0.06)]">
            {youReady && (
              <li className="grid grid-cols-[28px_1fr_auto] items-center gap-2.5 py-[9px] text-[13px] font-semibold text-[#1a1e1b] dark:text-[#f5f7f3]">
                <span className="w-7 h-7 rounded-full grid place-items-center text-[10px] font-bold bg-[#b7ff00] text-black">You</span>
                <span>You</span>
                <PositionChips primary={primaryPosition} secondary={secondaryPosition} />
              </li>
            )}
            {visible.map(p => (
              <li key={p.id} className="grid grid-cols-[28px_1fr_auto] items-center gap-2.5 py-[9px] text-[13px] text-[#1a1e1b] dark:text-[#f5f7f3]">
                <span className="w-7 h-7 rounded-full grid place-items-center text-[10.5px] font-semibold border-[0.8px]
                  bg-[#edeee8] border-[rgba(11,13,12,0.16)] text-[#3b4239]
                  dark:bg-[#0b0d0c] dark:border-[rgba(245,247,243,0.12)] dark:text-[#a6b0a3]">
                  {initials(applicantName(p))}
                </span>
                <span className="truncate">{applicantName(p)}</span>
                <PositionChips primary={p.position} secondary={p.payload?.secondary_position} />
              </li>
            ))}
          </ul>

          {players.length > VISIBLE_PLAYERS && (
            <button
              type="button"
              onClick={() => setShowAll(v => !v)}
              className="mt-2.5 flex w-full items-center justify-between text-[13px] font-semibold text-[#3f6b00] dark:text-[#b7ff00]"
            >
              {showAll ? "Show less" : "View all players"}
              <ChevronRight className={`w-4 h-4 transition-transform ${showAll ? "-rotate-90" : ""}`} />
            </button>
          )}
        </>
      )}
    </>
  );
}

const CARD = `rounded-[18px] border-[0.8px]
  bg-[#f4f5f0] border-[rgba(11,13,12,0.08)]
  dark:bg-[#050606] dark:border-[rgba(245,247,243,0.06)]`;

export function CampPanel(props: Props) {
  return (
    <aside aria-label="Camp details" className={`${CARD} px-6 py-7`}>
      <CampContent {...props} />
    </aside>
  );
}

export function CampMobileBar(props: Props) {
  const [open, setOpen] = useState(false);
  const { program, availability } = props;
  const tone = availability ? toneOf(availability.spot_left) : "open";

  return (
    <div className={CARD}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[13px] text-[#3b4239] dark:text-[#a6b0a3]"
      >
        <span className="min-w-0 truncate">
          {program ? (
            <>
              <span className="font-semibold text-[#1a1e1b] dark:text-[#f5f7f3]">{program.title}</span>
              {!!availability?.spot && <span className={`font-semibold ${TONE_TEXT[tone]}`}> · {spotsLabel(availability.spot_left)}</span>}
            </>
          ) : (
            "No program selected yet"
          )}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[#6c7668] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t-[0.8px] border-[rgba(11,13,12,0.08)] dark:border-[rgba(245,247,243,0.06)]">
          <div className="pt-4" />
          <CampContent {...props} />
        </div>
      )}
    </div>
  );
}
