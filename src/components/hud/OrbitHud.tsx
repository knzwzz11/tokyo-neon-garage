import { activateHotspot, enterDrive, revBurst } from "@/game/actions";
import { SPECS, VEHICLE_ORDER } from "@/game/sim/specs";
import { HOTSPOT_COPY, useUI, type HotspotId } from "@/game/store";
import { world } from "@/game/world";
import { IconChevron, IconWheel } from "@/components/kit/icons";
import { Kbd } from "@/components/kit/parts";
import { cn } from "@/lib/utils";

const ORDER: HotspotId[] = ["chest", "portrait", "phone"];

function Stations() {
  const hovered = useUI((s) => s.hovered);
  const setHovered = useUI((s) => s.setHovered);
  return (
    <div className="pointer-events-auto flex gap-2 overflow-x-auto md:w-[260px] md:flex-col md:overflow-visible">
      {ORDER.map((id) => {
        const c = HOTSPOT_COPY[id];
        const hot = hovered === id;
        return (
          <button
            key={id}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(id)}
            onBlur={() => setHovered(null)}
            onClick={() => activateHotspot(id)}
            className={cn(
              "shrink-0 rounded-[6px] border bg-panel/85 px-4 py-3 text-left backdrop-blur transition-all",
              hot ? "border-aura animate-aura" : "border-hi/10 hover:border-pink",
            )}
          >
            <div className="font-display text-[11px] tracking-[0.25em] text-aura">{c.tag}</div>
            <div className="text-[13px] font-semibold tracking-wide text-hi">{c.title}</div>
            {c.chips && (
              <div className="mt-2 flex gap-1.5">
                {c.chips.map((chip) => (
                  <span key={chip} className="rounded-[4px] border border-hi/15 bg-ink px-2 py-0.5 text-[10px] font-bold tracking-wider text-chrome">
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function VehicleCard() {
  const selected = useUI((s) => s.selected);
  const select = useUI((s) => s.select);
  const t = useUI((s) => s.telemetry);
  const spec = SPECS[selected];
  const idx = VEHICLE_ORDER.indexOf(selected);
  const cycle = (d: number) => select(VEHICLE_ORDER[(idx + d + VEHICLE_ORDER.length) % VEHICLE_ORDER.length]!);
  const rpmFrac = Math.min(1, t.rpm / spec.redline);
  const bars = 12;
  return (
    <div className="pointer-events-auto w-full rounded-[8px] border border-hi/10 bg-panel/85 p-4 backdrop-blur md:w-[300px]">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => cycle(-1)} aria-label="Veículo anterior" className="grid h-8 w-8 place-items-center rounded-[6px] border border-hi/15 text-chrome hover:border-neon">
          <IconChevron dir="left" />
        </button>
        <div className="min-w-0 text-center">
          <div className="text-[10px] font-bold tracking-[0.3em] text-chrome/60">{String(idx + 1).padStart(2, "0")} / 04 · {spec.short}</div>
          <div className="truncate font-display text-[15px] text-hi">{spec.name}</div>
        </div>
        <button onClick={() => cycle(1)} aria-label="Próximo veículo" className="grid h-8 w-8 place-items-center rounded-[6px] border border-hi/15 text-chrome hover:border-neon">
          <IconChevron />
        </button>
      </div>
      <div className="mt-3 flex h-6 items-end gap-[3px]">
        {Array.from({ length: bars }, (_, i) => {
          const on = i / bars < rpmFrac - 0.02;
          return <span key={i} className={cn("flex-1 rounded-[1px]", on ? (i > bars * 0.75 ? "bg-pink" : "bg-neon") : "bg-hi/10")} style={{ height: `${30 + (i / bars) * 70}%` }} />;
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] tracking-widest text-chrome/60">
        <span>{Math.round(t.rpm).toLocaleString("pt-BR")} RPM</span>
        <span>LIMITE {(spec.redline / 1000).toFixed(0)}K</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); world.revHold = true; revBurst(250); }}
          onPointerUp={() => { world.revHold = false; }}
          onPointerCancel={() => { world.revHold = false; }}
          onClick={() => revBurst(900)}
          className="flex h-11 flex-1 select-none items-center justify-center gap-2 rounded-[6px] border border-pink/60 bg-pink/10 text-[12px] font-bold tracking-wider text-hi hover:bg-pink/20 active:bg-pink/30"
        >
          <Kbd pink>R</Kbd>
          CORTAR DE GIRO
        </button>
      </div>
      <button
        onClick={enterDrive}
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-neon text-[13px] font-bold tracking-wider text-ink glow-neon"
      >
        <IconWheel />
        [DRIVE] ASSUMIR O VOLANTE
      </button>
    </div>
  );
}

export function OrbitHud() {
  const show = useUI((s) => s.mode === "orbit" && !s.modal);
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute left-3 right-3 top-3 md:left-auto md:right-8 md:top-1/2 md:-translate-y-1/2">
        <div className="mb-3 hidden text-[11px] font-bold tracking-[0.3em] text-chrome/60 md:block">ESTAÇÕES / GARAGEM</div>
        <Stations />
      </div>
      <div className="absolute bottom-3 left-3 right-3 md:bottom-8 md:left-8 md:right-auto">
        <VehicleCard />
      </div>
      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-3 rounded-full border border-hi/15 bg-ink/85 px-5 py-3 text-[13px] text-chrome backdrop-blur lg:flex">
        <span className="h-2 w-2 rounded-full bg-aura shadow-[0_0_10px_var(--aura)]" />
        <span>Arraste para girar a garagem</span>
        <span className="text-chrome/30">·</span>
        <span>Clique nos objetos com aura roxa para inspecionar</span>
      </div>
    </div>
  );
}
