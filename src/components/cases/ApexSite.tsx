import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TYRES = ["FL", "FR", "RL", "RR"];

export function ApexSite() {
  const [live, setLive] = useState(true);
  const [t, setT] = useState(0);
  const [tab, setTab] = useState<"live" | "laps">("live");
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setT((v) => v + 1), 100);
    return () => window.clearInterval(id);
  }, [live]);
  const lapT = (t % 1028) / 10;
  const lap = `${Math.floor(lapT / 60)}:${(lapT % 60).toFixed(1).padStart(4, "0")}`;
  const gx = Math.sin(t * 0.09) * 0.9;
  const gy = Math.cos(t * 0.13) * 0.6;
  const speeds = Array.from({ length: 60 }, (_, i) => 120 + Math.sin((t + i) * 0.18) * 60 + Math.sin((t + i) * 0.05) * 30);
  const path = speeds.map((v, i) => `${i === 0 ? "M" : "L"}${(i / 59) * 300} ${110 - (v / 250) * 100}`).join(" ");
  const laps = [102.8, 101.9, 103.4, 102.2, 101.6, 102.9, 102.8];
  return (
    <div className="min-h-full bg-ink font-hud text-hi">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-hi/10 px-6 py-4 md:px-10">
        <div className="flex items-center gap-2 font-display text-[18px]"><span className="text-neon">▲</span> Apex Telemetry</div>
        <div className="flex rounded-[8px] border border-hi/15 bg-panel p-1">
          {(["live", "laps"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={cn("h-8 rounded-[6px] px-4 text-[12px] font-bold tracking-wider", tab === k ? "bg-neon text-ink" : "text-chrome/60")}>{k === "live" ? "LIVE" : "VOLTAS"}</button>
          ))}
        </div>
        <button onClick={() => setLive((v) => !v)} className={cn("flex h-9 items-center gap-2 rounded-[6px] px-4 text-[12px] font-bold tracking-wider", live ? "bg-pink text-hi glow-pink" : "border border-hi/15 text-chrome")}>
          <span className={cn("h-2 w-2 rounded-full bg-hi", live && "animate-pulse")} /> {live ? "SESSÃO AO VIVO" : "INICIAR SESSÃO"}
        </button>
      </nav>
      {tab === "live" ? (
        <div className="grid gap-4 p-6 md:grid-cols-3 md:p-10">
          <div className="rounded-[8px] border border-hi/10 bg-panel p-5">
            <div className="text-[11px] font-bold tracking-[0.25em] text-chrome/60">LAP 07 / 12</div>
            <div className="mt-2 font-display text-[52px] leading-none text-neon">{lap}</div>
            <div className="mt-4 flex justify-between text-[13px]"><span className="text-chrome/60">Melhor 1:41.6</span><span className="text-pink">Δ +0.41</span></div>
          </div>
          <div className="rounded-[8px] border border-hi/10 bg-panel p-5">
            <div className="text-[11px] font-bold tracking-[0.25em] text-chrome/60">G-FORCE</div>
            <svg viewBox="0 0 120 120" className="mx-auto mt-2 h-36 w-36">
              {[50, 34, 18].map((r) => <circle key={r} cx="60" cy="60" r={r} fill="none" stroke="var(--neon)" strokeOpacity="0.3" />)}
              <path d="M60 10V110M10 60H110" stroke="var(--chrome)" strokeOpacity="0.2" />
              <circle cx={60 + gx * 45} cy={60 + gy * 45} r="5" fill="var(--pink)" />
            </svg>
            <div className="text-center font-display text-[22px]">{Math.hypot(gx, gy * 1.4).toFixed(2)}g</div>
          </div>
          <div className="rounded-[8px] border border-hi/10 bg-panel p-5">
            <div className="text-[11px] font-bold tracking-[0.25em] text-chrome/60">TYRE TEMP</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {TYRES.map((k, i) => {
                const temp = Math.round(90 + Math.sin(t * 0.04 + i) * 6 + i);
                return (
                  <div key={k} className="rounded-[6px] border border-hi/10 bg-ink p-3 text-center">
                    <div className={cn("font-display text-[26px]", temp > 95 ? "text-pink" : "text-neon")}>{temp}°</div>
                    <div className="text-[11px] tracking-widest text-chrome/60">{k}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-[8px] border border-hi/10 bg-panel p-5 md:col-span-3">
            <div className="flex justify-between text-[11px] font-bold tracking-[0.25em] text-chrome/60"><span>VELOCIDADE (KM/H)</span><span className="text-neon">{Math.round(speeds[59] ?? 0)} KM/H</span></div>
            <svg viewBox="0 0 300 115" className="mt-3 h-40 w-full" preserveAspectRatio="none">
              <path d={path} fill="none" stroke="var(--neon)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      ) : (
        <div className="p-6 md:p-10">
          <div className="flex flex-col gap-2">
            {laps.map((l, i) => {
              const best = l === Math.min(...laps);
              return (
                <div key={i} className={cn("flex h-12 items-center gap-4 rounded-[6px] border px-4", best ? "border-neon bg-neon/10" : "border-hi/10 bg-panel")}>
                  <span className="font-display text-chrome/50">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-semibold">{`${Math.floor(l / 60)}:${(l % 60).toFixed(1).padStart(4, "0")}`}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-hi/10"><div className={cn("h-full rounded-full", best ? "bg-neon" : "bg-pink")} style={{ width: `${((104 - l) / 3) * 100}%` }} /></div>
                  {best && <span className="text-[11px] font-bold tracking-widest text-neon">MELHOR</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
