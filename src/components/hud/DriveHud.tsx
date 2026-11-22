import { activateHotspot, exitDrive } from "@/game/actions";
import { HOTSPOT_COPY, useUI, type HotspotId } from "@/game/store";
import { GARAGE, STATIONS } from "@/game/world";
import { Kbd } from "@/components/kit/parts";
import { cn } from "@/lib/utils";
import { TouchControls } from "./TouchControls";

const ORDER: HotspotId[] = ["chest", "portrait", "phone"];

function MiniMap() {
  const t = useUI((s) => s.telemetry);
  const near = useUI((s) => s.near);
  // map: x -> right, z -> down (back wall at top)
  const sx = (x: number) => 75 + (x / GARAGE.halfX) * 52;
  const sz = (z: number) => 75 + (z / GARAGE.halfZ) * 38;
  const deg = (-t.yaw * 180) / Math.PI + 180;
  return (
    <div className="relative h-[150px] w-[150px] shrink-0 overflow-hidden rounded-full border-2 border-neon/60 bg-panel/85">
      <svg viewBox="0 0 150 150" className="absolute inset-0">
        <rect x={23} y={37} width={104} height={76} fill="none" stroke="var(--chrome)" strokeOpacity={0.25} strokeWidth={3} />
        <circle cx={75} cy={sz(8)} r={14} fill="none" stroke="var(--pink)" strokeOpacity={0.5} strokeDasharray="3 3" />
        {ORDER.map((id) => (
          <circle key={id} cx={sx(STATIONS[id].x)} cy={sz(STATIONS[id].z)} r={near === id ? 6 : 4} fill={near === id ? "var(--aura)" : "var(--chrome)"} />
        ))}
        <g transform={`translate(${sx(t.x)} ${sz(t.z)}) rotate(${deg})`}>
          <path d="M0 -8 L6 6 L0 3 L-6 6 Z" fill="var(--neon)" />
        </g>
      </svg>
      <span className="absolute left-1/2 top-2 -translate-x-1/2 text-[10px] font-bold text-chrome/70">N</span>
    </div>
  );
}

function Tacho() {
  const t = useUI((s) => s.telemetry);
  const frac = Math.min(1, t.rpm / t.redline);
  const bars = 10;
  return (
    <div className="w-[230px] rounded-[8px] border border-hi/10 bg-panel/85 p-4">
      <div className="flex h-10 items-end gap-[3px]">
        {Array.from({ length: bars }, (_, i) => {
          const on = i / bars < frac;
          return <span key={i} className={cn("w-3", on ? (i >= 6 ? "bg-pink" : "bg-neon") : "bg-hi/10")} style={{ height: `${(i + 3) * 3.2}px` }} />;
        })}
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <span className="font-display text-[44px] leading-none text-hi">{Math.round(t.speed)}</span>
          <span className="ml-1 text-[11px] text-chrome/60">KM/H</span>
        </div>
        <div className="text-right">
          <div className="font-display text-[28px] leading-none text-pink">{t.gear}</div>
          <div className="text-[10px] tracking-widest text-chrome/60">{(t.rpm / 1000).toFixed(1)}k RPM</div>
        </div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-hi/10">
        <div className="h-full rounded-full bg-neon" style={{ width: `${frac * 100}%` }} />
      </div>
    </div>
  );
}

function StationList() {
  const t = useUI((s) => s.telemetry);
  const near = useUI((s) => s.near);
  return (
    <div className="w-[230px]">
      <div className="mb-3 text-[11px] font-bold tracking-[0.3em] text-chrome/60">ESTAÇÕES / PROJETOS</div>
      <div className="flex flex-col gap-2">
        {ORDER.map((id, i) => {
          const st = STATIONS[id];
          const d = Math.hypot(st.x - t.x, st.z - t.z);
          const on = near === id;
          return (
            <button
              key={id}
              onClick={() => activateHotspot(id)}
              className={cn(
                "pointer-events-auto flex h-12 items-center gap-3 rounded-[6px] border px-4 text-left",
                on ? "border-neon bg-neon/15 text-hi glow-neon-soft" : "border-hi/10 bg-panel/80 hover:border-pink",
              )}
            >
              <span className={cn("font-display", on ? "text-neon" : "text-chrome/50")}>{String(i + 1).padStart(2, "0")}</span>
              <span className="font-semibold tracking-wider">{st.label}</span>
              <span className={cn("ml-auto text-[11px]", on ? "text-neon" : "text-chrome/50")}>{Math.round(d)} M</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DriveHud() {
  const show = useUI((s) => s.mode === "drive" && !s.modal);
  const near = useUI((s) => s.near);
  const t = useUI((s) => s.telemetry);
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <button
        onClick={exitDrive}
        className="pointer-events-auto absolute left-3 top-3 flex h-10 items-center gap-2 rounded-[6px] border border-hi/15 bg-ink/85 px-3 text-[12px] font-bold tracking-wider text-hi hover:border-pink md:left-8 md:top-8"
      >
        <Kbd>ESC</Kbd> SAIR DO VOLANTE
      </button>
      {t.driftScore > 0 && (
        <div className="absolute left-1/2 top-6 -translate-x-1/2 text-center">
          <div className={cn("font-display text-[11px] tracking-[0.4em]", t.drifting ? "text-pink" : "text-chrome/60")}>{t.drifting ? "DRIFTANDO" : "DRIFT"}</div>
          <div className={cn("font-display text-[34px] leading-none text-hi transition-transform", t.drifting && "scale-110")}>{t.driftScore.toLocaleString("pt-BR")}</div>
        </div>
      )}
      <div className="absolute bottom-8 left-8 hidden items-end gap-4 md:flex">
        <MiniMap />
        <Tacho />
      </div>
      <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 md:block">
        <StationList />
      </div>
      {near && (
        <button
          onClick={() => activateHotspot(near)}
          className="pointer-events-auto absolute bottom-28 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-[6px] border border-aura bg-ink/90 px-5 py-3 animate-aura md:bottom-28"
        >
          <Kbd pink>ENTER</Kbd>
          <span className="text-left">
            <span className="block font-display text-[11px] tracking-[0.25em] text-aura">{HOTSPOT_COPY[near].tag}</span>
            <span className="block text-[13px] font-semibold text-hi">{HOTSPOT_COPY[near].title}</span>
          </span>
        </button>
      )}
      <div className="absolute bottom-10 left-1/2 hidden h-14 -translate-x-1/2 items-center gap-3 rounded-full border border-hi/15 bg-ink/85 px-5 text-[13px] text-chrome lg:flex">
        <span className="flex gap-1">
          <Kbd>W</Kbd><Kbd>A</Kbd><Kbd>S</Kbd><Kbd>D</Kbd>
        </span>
        <span>dirigir</span>
        <Kbd pink>ESPAÇO</Kbd>
        <span>drift</span>
        <Kbd>R</Kbd>
        <span>corte de giro</span>
      </div>
      <TouchControls />
    </div>
  );
}
