"use client";

import Link from "next/link";
import { CAMP, whatsappHref } from "./content";
import "./scouting-camp.css";

/* /scouting-camp/thank-you — where a sign-up lands. This is the Google Ads
 * conversion page: when the client has their conversion tag, it goes in the
 * page component (app/scouting-camp/thank-you/page.tsx), not here. */
export function ScoutingCampThankYou({ fontClass, backPath }: { fontClass: string; backPath: string }) {
  return (
    <div className={`sc-page ${fontClass}`}>
      <section className="thanks" aria-labelledby="thanks-title">
        <div className="wrap">
          <span className="eyebrow">
            {CAMP.name} · {CAMP.dates}
          </span>
          <h1 id="thanks-title">
            You&apos;re on the list.
          </h1>
          <p>
            Thanks for reserving your place. Our team will reply on WhatsApp within {CAMP.replyWithin} with the next
            steps. Keep your phone close.
          </p>
          <div className="row">
            <a className="btn btn-lime" href={whatsappHref("Hi Golafly, I just registered for the Scouting Camp.")} target="_blank" rel="noopener noreferrer">
              <span className="wa-dot" />
              Message us on WhatsApp
            </a>
            <Link className="btn btn-ghost" href={backPath}>
              Back to the camp
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
