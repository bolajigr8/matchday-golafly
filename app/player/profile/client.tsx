"use client";

import { ExternalLink } from "lucide-react";
import {
  DownloadCvButton,
  InfoCard,
  PageHeader,
  PlayerGate,
  ageFrom,
  dash,
  fmtDate,
} from "@/components/player/player-states";
import { rawField } from "@/features/player/hooks";
import type { ApiPlayer } from "@/services/players";

/* Player dashboard — Profile. Everything Golafly holds about the player, read
   from GET /v1/players/{id}, and the CV built from it. Read-only: the API
   gives a player no way to edit their own record. */

export default function PlayerProfileClient() {
  return (
    <div className="flex flex-col gap-5">
      <PlayerGate>
        {player => (
          <>
            <PageHeader
              title="Profile"
              subtitle="Your details as Golafly and scouts see them."
              action={<DownloadCvButton player={player} />}
            />
            <Profile player={player} />
          </>
        )}
      </PlayerGate>
    </div>
  );
}

const asObject = (v: unknown): Record<string, unknown> | null => {
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
};

function Profile({ player }: { player: ApiPlayer }) {
  const f = (key: string) => rawField(player, key);
  const age = ageFrom(player.date_of_birth);

  const statsRaw = player.career_statistics;
  const season = Array.isArray(statsRaw) ? asObject(statsRaw[0]) : asObject(statsRaw);
  const stats: [string, unknown][] = [
    ["Appearances", season?.appearances],
    ["Goals", season?.goals],
    ["Assists", season?.assists],
    ["Clean sheets", season?.clean_sheets],
    ["Minutes", season?.minutes_played],
    ["Yellow cards", season?.yellow_cards ?? season?.yellow_card],
    ["Red cards", season?.red_cards ?? season?.red_card],
  ];

  const achievements = (Array.isArray(f("achievements")) ? (f("achievements") as unknown[]) : [])
    .map(a => asObject(a) ?? (typeof a === "string" ? { title: a } : null))
    .filter((a): a is Record<string, unknown> => !!a && !!a.title);

  const links: [string, unknown][] = [
    ["Highlight video", player.highlight_video_url],
    ["Uploaded CV", f("player_cv")],
    ["Passport", f("passport_document") ?? player.passport_document_url],
    ["Medical certificate", f("medical_certificate") ?? player.medical_certificate_url],
  ];
  const presentLinks = links.filter(
    (l): l is [string, string] => typeof l[1] === "string" && /^https?:\/\//.test(l[1]),
  );

  return (
    <>
      <div className="grid gap-3.5 lg:grid-cols-2">
        <InfoCard
          title="Personal"
          rows={[
            ["Date of birth", `${fmtDate(player.date_of_birth)}${age === null ? "" : ` · ${age}`}`],
            ["Gender", dash(player.gender)],
            ["Nationality", dash(player.nationality)],
            ["Based in", [player.city, player.country_of_residence].filter(Boolean).join(", ") || "—"],
            ["Languages", dash(f("language_spoken"))],
          ]}
        />
        <InfoCard
          title="Football"
          rows={[
            ["Primary position", dash(player.primary_position)],
            ["Secondary position", dash(player.secondary_position)],
            ["Preferred foot", dash(player.preferred_foot)],
            ["Jersey number", dash(player.jersey_number)],
            ["Club / academy", dash(player.current_club_academy)],
            ["Level", dash(player.current_level)],
            ["Availability", dash(player.player_status)],
          ]}
        />
        <InfoCard
          title="Physical"
          rows={[
            ["Height", player.height_cm ? `${player.height_cm} cm` : "—"],
            ["Weight", player.weight_kg ? `${player.weight_kg} kg` : "—"],
            ["Top speed", f("top_speed") ? `${dash(f("top_speed"))} km/h` : "—"],
          ]}
        />
        <InfoCard
          title="Ambitions"
          rows={[
            ["Preferred country", dash(f("preferred_country"))],
            ["Preferred league", dash(f("preferred_league"))],
            ["Club type", dash(f("preferred_club_type"))],
            ["Career goals", dash(f("career_level_goals"))],
          ]}
        />
      </div>

      <section className="rounded-[20px] border border-border bg-card p-[18px]">
        <h2 className="font-heading text-[14px] font-bold text-foreground">
          Career statistics{season?.season ? ` · ${dash(season.season)}` : ""}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-muted px-3 py-2.5">
              <p className="font-heading text-[18px] font-bold tabular-nums text-foreground">
                {typeof value === "number" || typeof value === "string" ? dash(value) : "0"}
              </p>
              <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <section className="rounded-[20px] border border-border bg-card p-[18px]">
          <h2 className="font-heading text-[14px] font-bold text-foreground">Achievements</h2>
          {achievements.length ? (
            <ul className="mt-3 flex flex-col gap-2 pl-0">
              {achievements.map((a, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-foreground">{dash(a.title)}</span>
                  {a.year != null && (
                    <span className="font-mono text-[11px] text-muted-foreground">{dash(a.year)}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] text-muted-foreground">No achievements recorded.</p>
          )}
        </section>

        <section className="rounded-[20px] border border-border bg-card p-[18px]">
          <h2 className="font-heading text-[14px] font-bold text-foreground">Media &amp; documents</h2>
          {presentLinks.length ? (
            <ul className="mt-3 flex flex-col gap-2 pl-0">
              {presentLinks.map(([label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-text hover:underline"
                  >
                    {label}
                    <ExternalLink className="size-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] text-muted-foreground">No media or documents uploaded.</p>
          )}
        </section>
      </div>
    </>
  );
}
