"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CountryDropdown, type Country } from "@/components/ui/county-dropdown";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput } from "@/components/apply-now/phone-input";
import { CampDobField } from "./dob-field";
import { CAMP, POSITIONS, whatsappHref } from "./content";
import { campAttribution, saveCampAttribution, submitCampSignup } from "./api";
import "./scouting-camp.css";

/* GOLAFLY SCOUTING CAMP — the client's Google Ads landing page, ported from
 * their HTML ("Golafly Scouting Camp Landing Page.html"). Same markup and
 * class names, so scouting-camp.css applies as designed.
 *
 * Content comes from ./content.ts: anything not confirmed yet is hidden, and
 * the section menu lists only the sections that are showing. The form sends
 * the sign-up to HubSpot (not the Golafly backend) and then sends the player
 * to /scouting-camp/thank-you — the Google Ads conversion page. */

type Section = { id: string; label: string };

/* The section in view is kept in the URL as ?section=<id>, so a link to the
   page can open on a section. replaceState, so scrolling adds no history
   entries; the other params (gclid, UTMs) are left as they are. */
const SECTION_PARAM = "section";

// Gallery photos are full-size uploads; ask Cloudinary for a web-sized one.
const campPhoto = (src: string) => src.replace("/upload/", "/upload/w_900,c_limit,q_auto,f_auto/");

function writeSection(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set(SECTION_PARAM, id);
  else url.searchParams.delete(SECTION_PARAM);
  const next = url.pathname + url.search;
  if (next !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(null, "", next);
  }
}

export function ScoutingCampLanding({
  fontClass,
  thankYouPath,
  logoSrc,
}: {
  fontClass: string;
  thankYouPath: string;
  logoSrc: string;
}) {
  const hasProgramme = CAMP.programme.length > 0;
  const hasIncluded = CAMP.included.length > 0 || !!CAMP.fee;
  const hasScouts = CAMP.logos.length > 0;
  const hasStay = CAMP.stay.photos.length > 0;
  const hasStories = CAMP.stories.length > 0 || CAMP.stats.length > 0 || !!CAMP.videoSrc;
  const faq = CAMP.faq.filter(f => f.a);

  const sections: Section[] = [
    { id: "who", label: "Who It's For" },
    ...(hasProgramme ? [{ id: "how", label: "How It Works" }] : []),
    ...(hasIncluded ? [{ id: "included", label: "Included" }] : []),
    ...(hasStay ? [{ id: "stay", label: "Stay" }] : []),
    ...(hasScouts ? [{ id: "scouts", label: "Clubs" }] : []),
    ...(hasStories ? [{ id: "stories", label: "Testimonials" }] : []),
    ...(faq.length ? [{ id: "faq", label: "FAQ" }] : []),
  ];

  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(true);
  const formRef = useRef<HTMLDivElement>(null);
  const topbarRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  // True while a menu click (or the opening ?section=) is scrolling the page,
  // so the sections passed on the way don't each take the highlight.
  const jumping = useRef(false);
  const jumpTimer = useRef<number | undefined>(undefined);

  const scrollToId = (id: string, smooth: boolean) => {
    const el = document.getElementById(id);
    if (!el) return;
    const done = () => {
      window.clearTimeout(jumpTimer.current);
      jumping.current = false;
    };
    jumping.current = true;
    window.clearTimeout(jumpTimer.current);
    jumpTimer.current = window.setTimeout(done, 1200);
    window.addEventListener("scrollend", done, { once: true });
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: smooth && !calm ? "smooth" : "auto", block: "start" });
  };

  // Keep Google Ads attribution (gclid / UTMs) from the landing URL.
  useEffect(() => saveCampAttribution(), []);

  // Open on the section the URL names: ?section=faq, or an older #faq link.
  useEffect(() => {
    const wanted =
      new URLSearchParams(window.location.search).get(SECTION_PARAM) ?? window.location.hash.slice(1);
    if (!wanted) return;
    const inMenu = sections.some(s => s.id === wanted);
    if (!inMenu && wanted !== "register") return writeSection(null);
    const frame = requestAnimationFrame(() => {
      scrollToId(wanted, false);
      setActive(inMenu ? wanted : null);
      writeSection(wanted);
    });
    return () => cancelAnimationFrame(frame);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight the section in view and keep it in the URL; back up in the hero
  // nothing is highlighted. Hide the mobile sticky CTA while the form shows.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      entries =>
        entries.forEach(e => {
          if (!e.isIntersecting || jumping.current) return;
          const id = e.target === heroRef.current ? null : e.target.id;
          setActive(id);
          writeSection(id);
        }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    if (heroRef.current) io.observe(heroRef.current);
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    const formIo = new IntersectionObserver(([e]) => setFormVisible(e.isIntersecting), { threshold: 0.2 });
    if (formRef.current) formIo.observe(formRef.current);
    return () => {
      io.disconnect();
      formIo.disconnect();
    };
  }, [sections.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // The mobile menu closes on Escape, on a tap outside the bar, and when the
  // window grows past the point where the menu sits in the bar.
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onDown = (e: PointerEvent) => {
      if (!topbarRef.current?.contains(e.target as Node)) close();
    };
    const wide = window.matchMedia("(min-width: 1001px)");
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    wide.addEventListener("change", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      wide.removeEventListener("change", close);
    };
  }, [menuOpen]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    scrollToId(id, true);
    setActive(sections.some(s => s.id === id) ? id : null);
    writeSection(id === "top" ? null : id);
  };

  const facts = [
    { label: "Dates", value: CAMP.dates },
    { label: "Venue", value: CAMP.city },
    { label: "Age group", value: CAMP.ageGroup },
    { label: "Places", value: CAMP.places != null ? String(CAMP.places) : null },
    { label: "Fee", value: CAMP.fee },
  ].filter((f): f is { label: string; value: string } => !!f.value);

  return (
    <div className={`sc-page ${fontClass}`}>
      <header className="topbar" ref={topbarRef}>
        <div className="wrap">
          <a className="logo" href="?" onClick={go("top")} aria-label="Golafly, back to top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Golafly" />
          </a>
          <nav className={`menu${menuOpen ? " open" : ""}`} id="menu" aria-label="Page sections">
            {sections.map(s => (
              <a
                key={s.id}
                href={`?${SECTION_PARAM}=${s.id}`}
                onClick={go(s.id)}
                className={active === s.id ? "active" : undefined}
                aria-current={active === s.id ? "true" : undefined}
              >
                {s.label}
              </a>
            ))}
          </nav>
          <div className="top-actions">
            <a className="btn btn-ghost wa" href={whatsappHref()} target="_blank" rel="noopener noreferrer">
              <span className="wa-dot" />
              <span className="lbl">WhatsApp</span>
            </a>
            <a className="btn btn-lime" href={`?${SECTION_PARAM}=register`} onClick={go("register")}>
              Register
            </a>
            <button
              className="burger"
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="menu"
              onClick={() => setMenuOpen(o => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* 1. HERO — headline first, form last */}
        <section className="hero" aria-labelledby="hero-title" ref={heroRef}>
          <div className="wrap">
            <div className="hero-copy">
              <span className="pillar-badge notranslate" translate="no">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m12 7 4 3-1.5 5h-5L8 10z" />
                  <path d="M12 3v4M21 10h-5M3 10h5M7 20l2.5-5M17 20l-2.5-5" />
                </svg>
                <span>
                  PLAY <b>IT</b>
                </span>
              </span>
              <span className="eyebrow">
                {CAMP.name} · {CAMP.dates}
              </span>
              <h1 id="hero-title">
                Are You Ready <em>To Be Seen?</em>
              </h1>
              <p className="lede">
                A {CAMP.days}-day scouting camp{CAMP.city ? ` in ${CAMP.city}` : ""} where you train, play matches and
                get evaluated in front of {CAMP.scoutsCount ? `${CAMP.scoutsCount} ` : ""}scouts from professional clubs
                and academies.
              </p>
              <ul className="ticks">
                <li>
                  <span>
                    <strong>Direct to club tryouts</strong> in front of professional clubs and academies
                  </span>
                </li>
                <li>
                  <span>
                    <strong>{CAMP.ageGroup ? `Players aged ${CAMP.ageGroup}` : "Players"}</strong>, all positions
                  </span>
                </li>
                <li>
                  <span>
                    <strong>{CAMP.places ? `Only ${CAMP.places} places` : "Limited places"}</strong>, first come first
                    served
                  </span>
                </li>
              </ul>
              <a className="btn btn-lime hero-cta" href={`?${SECTION_PARAM}=register`} onClick={go("register")}>
                Direct to Club →
              </a>
            </div>

            <div className="form-card" id="register" ref={formRef}>
              <CampForm thankYouPath={thankYouPath} />
            </div>
          </div>
        </section>

        {/* 2. KEY FACTS */}
        <div className="facts" aria-label="Camp key facts">
          <div className="wrap" style={{ gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))` }}>
            {facts.map(f => (
              <div key={f.label} className="fact">
                <small>{f.label}</small>
                <strong>{f.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* 3. WHO IT'S FOR */}
        <section className="block" id="who" aria-labelledby="for-title">
          <div className="wrap stack">
            <div className="sec-head">
              <span className="kicker">Who it&apos;s for</span>
              <h2 id="for-title">Built for players who want a real shot</h2>
            </div>
            <div className="grid3">
              {CAMP.audiences.map(a => (
                <article key={a.title} className="card">
                  <span className="tag">{a.tag}</span>
                  <h3>{a.title}</h3>
                  {a.body && <p>{a.body}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 4. PROGRAMME */}
        {hasProgramme && (
          <section className="block alt" id="how" aria-labelledby="prog-title">
            <div className="wrap stack">
              <div className="sec-head">
                <span className="kicker">How it works</span>
                <h2 id="prog-title">What happens across the {CAMP.days} days</h2>
              </div>
              <div className="days">
                {CAMP.programme.map(d => (
                  <div key={d.date} className="day">
                    <span className="date">{d.date}</span>
                    <h3>{d.title}</h3>
                    <p>{d.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. INCLUDED + FEE */}
        {hasIncluded && (
          <section className="block" id="included" aria-labelledby="inc-title">
            <div className="wrap stack">
              <div className="sec-head">
                <span className="kicker">What&apos;s included</span>
                <h2 id="inc-title">What your place covers</h2>
              </div>
              <div className="split" style={CAMP.fee && CAMP.included.length ? undefined : { gridTemplateColumns: "1fr" }}>
                {CAMP.included.length > 0 && (
                  <ul className="incl">
                    {CAMP.included.map((item, i) => (
                      <li key={item}>
                        <i>{i + 1}</i>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {CAMP.fee && (
                  <aside className="fee" aria-label="Camp fee">
                    <span className="kicker">Camp fee</span>
                    <div className="price">
                      {CAMP.fee} <small>per player</small>
                    </div>
                    {CAMP.feeNotes.length > 0 && (
                      <ul>
                        {CAMP.feeNotes.map(n => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    )}
                    <a className="btn btn-lime" href={`?${SECTION_PARAM}=register`} onClick={go("register")}>
                      Reserve My Place →
                    </a>
                  </aside>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 6. WHERE YOU STAY */}
        {hasStay && (
          <section className="block alt" id="stay" aria-labelledby="stay-title">
            <div className="wrap stack">
              <div className="sec-head">
                <span className="kicker">Accommodation</span>
                <h2 id="stay-title">Where you stay</h2>
                {CAMP.stay.place && <p className="sub">{CAMP.stay.place}</p>}
              </div>
              {CAMP.stay.points.length > 0 && (
                <ul className="ticks stay-points">
                  {CAMP.stay.points.map(point => (
                    <li key={point}>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="stay-grid">
                {CAMP.stay.photos.map(photo => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={photo.src} src={campPhoto(photo.src)} alt={photo.alt} loading="lazy" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 7. PARTNER CLUBS */}
        {hasScouts && (
          <section className="block" id="scouts" aria-labelledby="scouts-title">
            <div className="wrap stack">
              <div className="sec-head">
                <span className="kicker">Direct to club</span>
                <h2 id="scouts-title">Our partner clubs</h2>
              </div>
              <div
                className="logos"
                style={{ gridTemplateColumns: `repeat(${Math.min(CAMP.logos.length, 6)}, minmax(0, 1fr))` }}
              >
                {CAMP.logos.map(l => (
                  <div key={l.name} className="logo-slot club">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {l.src && <img src={l.src} alt="" loading="lazy" />}
                    <strong>{l.name}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 8. TESTIMONIALS */}
        {hasStories && (
          <section className="block alt" id="stories" aria-labelledby="proof-title">
            <div className="wrap stack">
              <div className="sec-head">
                <span className="kicker">Testimonials</span>
                <h2 id="proof-title">From our Barcelona camp</h2>
              </div>
              {CAMP.stats.length > 0 && (
                <div className="stats">
                  {CAMP.stats.map(s => (
                    <div key={s.label}>
                      <strong>{s.value}</strong>
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {CAMP.videoSrc && (
                <video
                  className="video-slot"
                  src={CAMP.videoSrc}
                  poster={CAMP.videoSrc.replace(/\.mp4$/, ".jpg")}
                  controls
                  preload="none"
                  playsInline
                />
              )}
              {CAMP.stories.length > 0 && (
                <div className="grid3">
                  {CAMP.stories.map(s => (
                    <article key={s.name} className="card">
                      <p className="quote">“{s.quote}”</p>
                      <div className="who">
                        <span className="avatar" />
                        <span>
                          <strong>{s.name}</strong>
                          <small>{s.meta}</small>
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 9. FAQ */}
        {faq.length > 0 && (
          <section className="block" id="faq" aria-labelledby="faq-title">
            <div className="wrap stack">
              <div className="sec-head">
                <span className="kicker">FAQ</span>
                <h2 id="faq-title">Before you register</h2>
              </div>
              <div className="faq">
                {faq.map(f => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 10. FINAL CTA */}
        <section className="final" aria-labelledby="final-title">
          <div className="wrap">
            <h2 id="final-title">Your next football opportunity starts here</h2>
            <p>
              {CAMP.datesLong}
              {CAMP.city ? ` · ${CAMP.city}` : ""}
              {CAMP.places ? ` · Only ${CAMP.places} places` : ""}
            </p>
            <a
              className="btn btn-lime"
              href={`?${SECTION_PARAM}=register`}
              onClick={go("register")}
              style={{ fontSize: 17, padding: "16px 30px" }}
            >
              Reserve My Place →
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="foot-row">
            <div className="foot-id">
              <strong>{CAMP.company}</strong>
              {CAMP.companyAddress && <span>{CAMP.companyAddress}</span>}
              <span>
                {CAMP.email} · {CAMP.phoneDisplay}
              </span>
            </div>
            <nav aria-label="Legal">
              <a href={CAMP.legal.privacy} target="_blank" rel="noopener noreferrer">
                Privacy
              </a>
              <a href={CAMP.legal.terms} target="_blank" rel="noopener noreferrer">
                Terms
              </a>
              <a href={CAMP.legal.refund} target="_blank" rel="noopener noreferrer">
                Refund policy
              </a>
            </nav>
          </div>
          <p className="copy">© {new Date().getFullYear()} {CAMP.company}</p>
        </div>
      </footer>

      <div className={`sticky-cta${formVisible ? " hidden" : ""}`}>
        <a className="btn btn-ghost" href={whatsappHref()} target="_blank" rel="noopener noreferrer">
          <span className="wa-dot" />
          WhatsApp
        </a>
        <a className="btn btn-lime" href={`?${SECTION_PARAM}=register`} onClick={go("register")}>
          Register
        </a>
      </div>
    </div>
  );
}

/* ── The form ──────────────────────────────────────────────────────────── */

type Values = {
  full_name: string;
  date_of_birth: string;
  position: string;
  country: string;
  phone: string;
  email: string;
  under_18: boolean;
  visa_required: boolean;
  guardian_name: string;
  guardian_phone: string;
  consent: boolean;
};

// Age today from a date input's "YYYY-MM-DD", read as a calendar date (not UTC).
const ageFrom = (dob: string) => {
  const [y, m, d] = dob.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now < new Date(now.getFullYear(), m - 1, d)) age--;
  return age;
};
// The backend accepts ages 1–120; anything else is a mistyped date.
const validAge = (dob: string) => {
  const age = ageFrom(dob);
  return age >= 1 && age <= 120;
};

function daysUntil(iso: string) {
  return Math.ceil((new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 864e5);
}

function CampForm({ thankYouPath }: { thankYouPath: string }) {
  const router = useRouter();
  const [v, setV] = useState<Values>({
    full_name: "",
    date_of_birth: "",
    position: "",
    country: "",
    phone: "",
    email: "",
    under_18: false,
    visa_required: false,
    guardian_name: "",
    guardian_phone: "",
    consent: false,
  });
  const [countryCode, setCountryCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const set = <K extends keyof Values>(k: K) => (val: Values[K]) => setV(p => ({ ...p, [k]: val }));

  // "N days until camp" is worked out in the browser, after the page loads.
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => setDays(daysUntil(CAMP.startsOn)), []); // eslint-disable-line react-hooks/set-state-in-effect
  const countdown =
    days == null ? `Camp starts ${CAMP.startsLabel}` : days > 1 ? `${days} days until camp` : days === 1 ? "Camp starts tomorrow" : "Camp is on";

  const errors = useMemo(() => {
    const e: Partial<Record<keyof Values, string>> = {};
    if (v.full_name.trim().split(/\s+/).length < 2) e.full_name = "Enter your first and last name";
    if (!v.date_of_birth) e.date_of_birth = "Enter your date of birth";
    else if (!validAge(v.date_of_birth)) e.date_of_birth = "Check the year — that date of birth isn’t valid";
    if (!v.position) e.position = "Choose your position";
    if (!v.country) e.country = "Choose your country";
    if (v.phone.replace(/\D/g, "").length < 7) e.phone = "Enter your WhatsApp number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = "Enter a valid email";
    if (v.under_18 && !v.guardian_name.trim()) e.guardian_name = "Enter a parent or guardian name";
    if (v.under_18 && v.guardian_phone.replace(/\D/g, "").length < 7) e.guardian_phone = "Enter their phone";
    if (!v.consent) e.consent = "Please agree so we can contact you";
    return e;
  }, [v]);
  const err = (k: keyof Values) => (touched ? errors[k] : undefined);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    const first = Object.keys(errors)[0];
    if (first) {
      document.getElementById(`sc-${first}`)?.focus();
      return;
    }
    setSending(true);
    try {
      const [first, ...rest] = v.full_name.trim().split(/\s+/);
      await submitCampSignup({
        first_name: first,
        last_name: rest.join(" "),
        date_of_birth: v.date_of_birth,
        age: ageFrom(v.date_of_birth),
        position: POSITIONS.find(p => p.code === v.position)?.label ?? v.position,
        country: v.country,
        visa_required: v.visa_required,
        phone: v.phone.trim(),
        email: v.email.trim(),
        under_18: v.under_18,
        ...(v.under_18 ? { guardian_name: v.guardian_name.trim(), guardian_phone: v.guardian_phone.trim() } : {}),
        ...campAttribution(),
      });
      router.push(thankYouPath);
    } catch (error) {
      setServerError((error as Error).message || "We couldn’t save your place. Check your connection and try again.");
      setSending(false);
    }
  };

  const total = CAMP.places;
  const taken = CAMP.placesTaken;
  const placesLine =
    total && taken != null ? (
      <div className="seats">
        <span>
          {taken} of {total} places taken
        </span>
        <span className="bar">
          <i style={{ width: `${Math.min(100, (taken / total) * 100)}%` }} />
        </span>
      </div>
    ) : null;

  return (
    <>
      <div className="form-head">
        <h2>Reserve your place</h2>
        <p className="deadline">
          {CAMP.registrationCloses ? `Registration closes ${CAMP.registrationCloses} · ` : ""}
          <strong>{countdown}</strong>
        </p>
        {placesLine}
      </div>

      <form onSubmit={submit} noValidate>
        <div className={`field full${err("full_name") ? " bad" : ""}`}>
          <label htmlFor="sc-full_name">Full name</label>
          <input
            id="sc-full_name"
            autoComplete="name"
            placeholder="e.g. Samuel Mensah"
            value={v.full_name}
            onChange={e => set("full_name")(e.target.value)}
          />
          {err("full_name") && <span className="err">{err("full_name")}</span>}
        </div>

        <div className={`field${err("date_of_birth") ? " bad" : ""}`}>
          <label htmlFor="sc-date_of_birth">Date of birth</label>
          <CampDobField id="sc-date_of_birth" value={v.date_of_birth} onChange={set("date_of_birth")} />
          {err("date_of_birth") && <span className="err">{err("date_of_birth")}</span>}
        </div>

        <div className={`field${err("position") ? " bad" : ""}`}>
          <label htmlFor="sc-position">Position</label>
          <Select value={v.position} onValueChange={set("position")}>
            <SelectTrigger id="sc-position" className="sc-box w-full justify-between px-3.5">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {POSITIONS.map(p => (
                <SelectItem key={p.code} value={p.code}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {err("position") && <span className="err">{err("position")}</span>}
        </div>

        <div className={`field${err("country") ? " bad" : ""}`}>
          <label htmlFor="sc-country">Country</label>
          <CountryDropdown
            onChange={(c: Country) => {
              set("country")(c.name);
              setCountryCode(c.alpha2);
            }}
            placeholder="Select"
            triggerClassName="sc-box w-full justify-between px-3.5"
          />
          {err("country") && <span className="err">{err("country")}</span>}
        </div>

        <div className={`field${err("phone") ? " bad" : ""}`}>
          <label htmlFor="sc-phone">WhatsApp number</label>
          <PhoneInput
            id="sc-phone"
            value={v.phone}
            onChange={set("phone")}
            country={countryCode}
            placeholder="801 234 5678"
            boxClassName="sc-box"
            inputClassName="bg-transparent dark:bg-transparent text-[15px] text-[var(--chalk)]"
          />
          {err("phone") && <span className="err">{err("phone")}</span>}
        </div>

        <div className={`field full${err("email") ? " bad" : ""}`}>
          <label htmlFor="sc-email">Email</label>
          <input
            id="sc-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={v.email}
            onChange={e => set("email")(e.target.value)}
          />
          {err("email") && <span className="err">{err("email")}</span>}
        </div>

        <label className="check" htmlFor="sc-visa_required">
          <input
            id="sc-visa_required"
            type="checkbox"
            checked={v.visa_required}
            onChange={e => set("visa_required")(e.target.checked)}
          />
          I’ll need a visa to travel to the camp
        </label>

        <label className="check" htmlFor="sc-under_18">
          <input id="sc-under_18" type="checkbox" checked={v.under_18} onChange={e => set("under_18")(e.target.checked)} />
          Player is under 18 (add a parent or guardian)
        </label>

        {v.under_18 && (
          <div className="guardian">
            <div className={`field${err("guardian_name") ? " bad" : ""}`}>
              <label htmlFor="sc-guardian_name">Parent / guardian name</label>
              <input
                id="sc-guardian_name"
                value={v.guardian_name}
                onChange={e => set("guardian_name")(e.target.value)}
              />
              {err("guardian_name") && <span className="err">{err("guardian_name")}</span>}
            </div>
            <div className={`field${err("guardian_phone") ? " bad" : ""}`}>
              <label htmlFor="sc-guardian_phone">Parent / guardian phone</label>
              <PhoneInput
                id="sc-guardian_phone"
                value={v.guardian_phone}
                onChange={set("guardian_phone")}
                country={countryCode}
                placeholder="801 234 5678"
                boxClassName="sc-box"
                inputClassName="bg-transparent dark:bg-transparent text-[15px] text-[var(--chalk)]"
              />
              {err("guardian_phone") && <span className="err">{err("guardian_phone")}</span>}
            </div>
          </div>
        )}

        <label className={`check${err("consent") ? " bad" : ""}`} htmlFor="sc-consent">
          <input id="sc-consent" type="checkbox" checked={v.consent} onChange={e => set("consent")(e.target.checked)} />
          <span>
            I agree to the{" "}
            <a href={CAMP.legal.privacy} target="_blank" rel="noopener noreferrer">
              privacy policy
            </a>{" "}
            and to be contacted about the camp.
          </span>
        </label>

        {serverError && (
          <p className="form-error" role="alert">
            {serverError}
          </p>
        )}

        <button className="btn btn-lime submit" type="submit" disabled={sending}>
          {sending ? "Saving your place…" : "Reserve My Place →"}
        </button>
        <p className="micro">Takes 60 seconds. Our team replies on WhatsApp within {CAMP.replyWithin}.</p>
        <ul className="trust">
          <li>Secure form</li>
          <li>FIFA-licensed team</li>
          <li>No payment now</li>
        </ul>
      </form>
    </>
  );
}
