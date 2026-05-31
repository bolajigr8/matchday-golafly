"use client";

import { AIRLINES_FILTER } from "@/store/travel";

const STOPS_OPTIONS = ["Direct", "1 Stop", "2+ Stops"] as const;

interface Props {
  selectedStops: string[];
  toggleStop: (s: string) => void;
  activeAirlines: string[];
  toggleAirline: (a: string) => void;
}

export function FlightFiltersSidebar({ selectedStops, toggleStop, activeAirlines, toggleAirline }: Props) {
  return (
    <aside className="space-y-6 rounded-xl border border-border bg-card p-4">
      {/* Stops */}
      <div>
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Stops
        </h3>
        <div className="space-y-2">
          {STOPS_OPTIONS.map(stop => (
            <label key={stop} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={selectedStops.includes(stop)}
                onChange={() => toggleStop(stop)}
                className="accent-primary h-3.5 w-3.5 cursor-pointer rounded"
              />
              <span className="text-[13px] text-foreground">{stop}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Price Range
        </h3>
        <div className="flex items-center justify-between font-mono text-[11px] text-primary">
          <span>€180</span><span>€270+</span>
        </div>
        <input type="range" min={180} max={700} defaultValue={400} className="mt-1.5 w-full accent-primary" />
      </div>

      {/* Departure time */}
      <div>
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Departure Time
        </h3>
        <p className="mb-1 text-[10px] text-muted-foreground">Outbound (LHR)</p>
        <input type="range" min={0} max={24} defaultValue={12} className="w-full accent-primary" />
        <p className="mb-1 mt-3 text-[10px] text-muted-foreground">Return (DXB)</p>
        <input type="range" min={0} max={24} defaultValue={18} className="w-full accent-primary" />
      </div>

      {/* Airlines */}
      <div>
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Airlines
        </h3>
        <div className="space-y-2">
          {AIRLINES_FILTER.map(a => (
            <label key={a.name} className="flex cursor-pointer items-center justify-between">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={activeAirlines.includes(a.name)}
                  onChange={() => toggleAirline(a.name)}
                  className="accent-primary h-3.5 w-3.5 cursor-pointer"
                />
                <span className="text-[13px] text-foreground">{a.name}</span>
              </div>
              <span className="font-mono text-[10px] text-primary">≤€{a.minPrice}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
