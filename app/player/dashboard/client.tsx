"use client";

import Link from "next/link";
import { ChevronRight, ClipboardList, Settings, UserRound } from "lucide-react";
import { FanPill } from "@/components/fan/ledger-card";
import { DownloadCvButton, PlayerGate, ageFrom, dash } from "@/components/player/player-states";
import { MyProgramCard } from "@/components/player/my-program-card";
import { useHydratedFan } from "@/features/fan/hooks";
import { firstName } from "@/features/fan/session";
import { overallAverage, reviewState, score, summary } from "@/features/scout/evaluation";
import { playerFullName, type ApiPlayer } from "@/services/players";
import { Routes } from "@/routes";
import { reportState } from "../report-state";

/* Player dashboard — Home. design/src/fan/03-screen-home.html, for a player:
   greeting, the hero (who you are and your CV), your scout report, then where
   to go next. */

const QUICK = [
  { href: Routes.playerProfile, icon: UserRound, title: "Profile", sub: "Your details" },
  { href: Routes.playerScoutReport, icon: ClipboardList, title: "Scout report", sub: "Scores & plan" },
  { href: Routes.playerSettings, icon: Settings, title: "Settings", sub: "Password" },
];

export default function PlayerHomeClient() {
  const { user } = useHydratedFan();

  return (
    <div className="flex flex-col gap-7">
      <header>
        <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="mt-1.5 text-[23px] font-bold tracking-[-0.03em] text-foreground">
          Hi {firstName(user?.name)}
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Your football profile and scout report, in one place.
        </p>
      </header>

      <PlayerGate>{player => <Home player={player} />}</PlayerGate>
    </div>
  );
}

function Home({ player }: { player: ApiPlayer }) {
  const name = playerFullName(player);
  const photo =
    player.profile_photo_url ?? (player as unknown as { profile_photo?: string }).profile_photo;
  const age = ageFrom(player.date_of_birth);
  const evaluation = player.evaluation;
  const report = reportState(evaluation);
  const approved = reviewState(evaluation) === "approved";

  return (
    <>
      {/* HERO — who you are, and the CV you send to clubs. */}
      <section>
        <div className="grid gap-5 rounded-[28px] border border-border bg-card p-[18px] sm:grid-cols-[1fr_220px]">
          <div className="flex min-w-0 gap-4">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                className="size-[64px] shrink-0 rounded-2xl object-cover shadow-[0_0_0_1px_var(--edge)]"
              />
            ) : (
              <span className="flex size-[64px] shrink-0 items-center justify-center rounded-2xl bg-brand font-heading text-[24px] font-bold text-brand-foreground">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              {player.player_status && <FanPill tone="info">{player.player_status}</FanPill>}
              <p className="mt-2.5 truncate font-heading text-[21px] font-bold text-foreground">{name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[player.primary_position, player.current_club_academy, player.nationality]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <DownloadCvButton player={player} />
                <Link
                  href={Routes.playerProfile}
                  className="inline-flex h-9 items-center rounded-xl px-4 text-[13px] font-semibold shadow-[0_0_0_1px_var(--edge-strong)] transition-colors hover:bg-accent"
                >
                  View profile
                </Link>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 content-center gap-x-4 gap-y-3 rounded-[20px] bg-muted p-4">
            {[
              ["Age", age === null ? "—" : String(age)],
              ["Height", player.height_cm ? `${player.height_cm} cm` : "—"],
              ["Foot", dash(player.preferred_foot)],
              ["Level", dash(player.current_level)],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {k}
                </dt>
                <dd className="m-0 mt-1 truncate font-heading text-[15px] font-bold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* MY PROGRAM — renders nothing when the player isn't on one. */}
      <MyProgramCard player={player} />

      {/* SCOUT REPORT */}
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-[15px] font-bold text-foreground">Your scout report</h2>
          <Link
            href={Routes.playerScoutReport}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-text"
          >
            View report
            <ChevronRight className="size-3" />
          </Link>
        </div>
        <div className="flex items-start gap-4 rounded-[20px] border border-border bg-card p-[15px]">
          <span className="flex size-[38px] shrink-0 items-center justify-center rounded-xl border border-[var(--edge)] bg-muted text-brand-text">
            <ClipboardList className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="font-heading text-[15px] font-bold text-foreground">
                {approved && evaluation
                  ? summary(evaluation.summary).headline || "Your report is ready"
                  : report.title}
              </p>
              <FanPill tone={report.tone}>{report.label}</FanPill>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {approved && evaluation
                ? `Overall ${score(overallAverage(evaluation))}/10`
                : report.body}
            </p>
          </div>
        </div>
      </section>

      {/* WHERE NEXT */}
      <section>
        <h2 className="mb-3 font-heading text-[15px] font-bold text-foreground">Go to</h2>
        <div className="grid gap-3.5 sm:grid-cols-3">
          {QUICK.map(({ href, icon: Icon, title, sub }) => (
            <Link
              key={title}
              href={href}
              className="rounded-[20px] border border-border bg-card p-[15px] transition-colors hover:border-[var(--brand-edge)]"
            >
              <span className="flex size-[38px] items-center justify-center rounded-xl border border-[var(--edge)] bg-muted text-brand-text">
                <Icon className="size-[18px]" />
              </span>
              <p className="mt-3 font-heading text-[13.5px] font-bold text-foreground">{title}</p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">{sub}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
