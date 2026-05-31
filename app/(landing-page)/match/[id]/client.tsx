"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MATCHES } from "@/store/matchday";

const imgHero      = "/figma/fedc7f165d8fd2c10a48fded8d08fb5a48c7a33b.png";
const imgStadium   = "/figma/b01eef212cfdae3dc78a4a2ae45b51bea5321ad5.png";
const imgSagrada   = "/figma/1524a9703d60ba170b8762ae15b7455b02fe81f8.png";
const imgGothic    = "/figma/b2955a2bb1a4d98a1b9b5c4568379e0feca7a587.png";
const imgParkGuell = "/figma/c75053ffa78035684ff89eb287af9944c565d266.png";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0 },
};

export function MatchDetailClient({ id }: { id: string }) {
  const match = MATCHES.find(m => m.id === id) || MATCHES[2];

  return (
    <div className="relative min-h-screen bg-background">
      {/* ── Hero ─── */}
      <div className="relative h-[340px] w-full overflow-hidden sm:h-[440px] md:h-[520px]">
        <motion.img
          src={imgHero}
          alt={`${match.team1} vs ${match.team2}`}
          className="h-full w-full object-cover"
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

        <motion.div className="absolute left-4 top-4 sm:left-6 sm:top-6" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-2 backdrop-blur transition-all hover:border-white/30">
            <ArrowLeft className="h-4 w-4 text-white" />
            <span className="font-mono text-[10px] tracking-wider text-white/80">All Matches</span>
          </Link>
        </motion.div>

        <motion.span className="absolute right-4 top-4 font-mono text-xs tracking-wider sm:right-6 sm:top-6" style={{ color: match.leagueColor }} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          {match.league}
        </motion.span>

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 sm:px-6 sm:pb-6">
          <motion.div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
            <div className="space-y-1.5">
              <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl">
                {match.team1} <span className="text-xl font-normal text-white/50 sm:text-2xl">vs</span> {match.team2}
              </h1>
              <p className="font-mono text-xs tracking-wider text-white/60">{match.venue} · {match.date}</p>
            </div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/flights/seats" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_rgba(183,255,0,0.4)] transition-all hover:shadow-[0_0_20px_rgba(183,255,0,0.5)]">
                Book This Match <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── Match Facts ─── */}
      <motion.div className="content-container py-6 sm:py-8" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }}>
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 sm:gap-4 sm:p-6 md:grid-cols-4">
          {[["Match Date", match.date],["Kick-off","21:00 CET"],["Venue","Estadi Olímpic"],["Competition", match.league]].map(([label, value]) => (
            <div key={label}>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-2 text-base font-bold text-foreground sm:text-lg">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Description + Travel ─── */}
      <motion.div className="content-container py-6 sm:py-8" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }}>
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">About This Match</h2>
            <p className="leading-relaxed text-muted-foreground">
              The Estadi Olímpic de Montjuïc hosts FC Barcelona as they battle {match.team2} in a La Liga encounter of the highest order. Perched on Montjuïc hill overlooking the city, the stadium offers a unique setting that blends sporting spectacle with breathtaking Mediterranean views.
            </p>
          </div>
          <div className="space-y-3 rounded-xl border border-border bg-card p-5 sm:p-6">
            <h3 className="font-bold text-foreground">Travel Overview</h3>
            <dl className="space-y-2.5 text-sm">
              {[["Country","Spain"],["Language","Catalan / Spanish"],["Currency","Euro (EUR)"],["Climate","22–26 °C in June"]].map(([dt, dd]) => (
                <div key={dt} className="flex justify-between border-t border-border pt-2.5 first:border-0 first:pt-0">
                  <dt className="text-muted-foreground">{dt}</dt>
                  <dd className="font-semibold text-foreground">{dd}</dd>
                </div>
              ))}
              <div className="border-t border-primary/30 pt-3">
                <p className="text-xs text-muted-foreground">Packages from</p>
                <p className="mt-1 text-2xl font-bold text-primary">{match.price}</p>
              </div>
            </dl>
          </div>
        </div>
      </motion.div>

      {/* ── Stadium ─── */}
      <motion.div className="content-container py-6 sm:py-8" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }}>
        <h2 className="mb-5 text-xl font-bold text-foreground sm:mb-6 sm:text-2xl">The Stadium</h2>
        <div className="space-y-5 sm:space-y-6">
          <div className="overflow-hidden rounded-xl">
            <motion.img src={imgStadium} alt="Estadi Olímpic" className="w-full object-cover" whileHover={{ scale: 1.03 }} transition={{ duration: 0.5 }} />
          </div>
          <p className="leading-relaxed text-muted-foreground">
            Originally constructed in 1927 and renovated for the 1992 Barcelona Olympic Games, the Estadi Olímpic de Montjuïc serves as FC Barcelona&apos;s temporary home during the Camp Nou renovation.
          </p>
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {[["Capacity","54,867"],["Year Built","1927"],["Record Attendance","77,000"]].map(([label, value]) => (
              <div key={label}>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="mt-2 text-xl font-bold text-foreground sm:text-2xl">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Landmarks ─── */}
      <motion.div className="content-container py-6 sm:py-8" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }}>
        <h2 className="mb-5 text-xl font-bold text-foreground sm:mb-6 sm:text-2xl">Explore Barcelona</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {[
            { img: imgSagrada,   name: "Sagrada Família", desc: "Gaudí's unfinished Baroque-Gothic masterpiece, under construction since 1882.", dist: "5 km from venue" },
            { img: imgGothic,    name: "Gothic Quarter",  desc: "Barcelona's medieval old town, a labyrinth of narrow streets and ancient Roman ruins.", dist: "4 km from venue" },
            { img: imgParkGuell, name: "Park Güell",      desc: "Gaudí's whimsical public park featuring mosaic terraces with panoramic views.",    dist: "6 km from venue" },
          ].map(({ img, name, desc, dist }, i) => (
            <motion.div
              key={name}
              className="overflow-hidden rounded-xl border border-border bg-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              whileHover={{ y: -4 }}
            >
              <div className="overflow-hidden h-44 sm:h-48">
                <motion.img src={img} alt={name} className="h-full w-full object-cover" whileHover={{ scale: 1.07 }} transition={{ duration: 0.4 }} />
              </div>
              <div className="space-y-1.5 p-4">
                <h3 className="font-bold text-foreground">{name}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                <p className="font-mono text-xs text-primary">{dist}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Getting There ─── */}
      <motion.div className="content-container py-6 sm:py-8" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }}>
        <h2 className="mb-5 text-xl font-bold text-foreground sm:mb-6 sm:text-2xl">Getting There</h2>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h3 className="mb-3 font-bold text-foreground">By Air</h3>
            <p className="text-sm leading-relaxed text-muted-foreground"><span className="font-semibold text-foreground">Barcelona El Prat (BCN)</span><br />Transfer to city centre: 35 min by Aerobus or Metro L9</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h3 className="mb-3 font-bold text-foreground">By Train</h3>
            <p className="text-sm leading-relaxed text-muted-foreground"><span className="font-semibold text-foreground">Estació de Sants (Sants Station)</span><br />Direct connections from major European cities</p>
          </div>
        </div>
      </motion.div>

      {/* ── CTA ─── */}
      <motion.div className="content-container py-8 sm:py-12" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5 }}>
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Link href="/flights/seats" className="block w-full rounded-full bg-primary py-4 text-center text-[15px] font-bold text-primary-foreground shadow-[0_0_20px_rgba(183,255,0,0.4)] transition-all hover:shadow-[0_0_35px_rgba(183,255,0,0.5)]">
            Book This Match — From {match.price}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
