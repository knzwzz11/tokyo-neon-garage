import { useEffect, useRef, useState } from "react";
import { audio } from "@/game/audio/audio";
import { world } from "@/game/world";
import { cn } from "@/lib/utils";

function Pedal({ label, onChange, className }: { label: string; onChange: (on: boolean) => void; className?: string }) {
  const [on, setOn] = useState(false);
  const set = (v: boolean) => { setOn(v); onChange(v); };
  return (
    <button
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); audio.ensure(); set(true); }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      className={cn("pointer-events-auto grid select-none place-items-center rounded-[8px] border font-display text-[12px] tracking-widest touch-none", on ? "border-pink bg-pink/30 text-hi" : "border-hi/20 bg-ink/70 text-chrome", className)}
    >
      {label}
    </button>
  );
}

export function TouchControls() {
  const [touch, setTouch] = useState(false);
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState(0);
  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    return () => { world.touch = { steer: 0, throttle: 0, brake: 0, handbrake: false, limiter: false }; };
  }, []);
  if (!touch) return null;
  const move = (clientX: number) => {
    const r = base.current?.getBoundingClientRect();
    if (!r) return;
    const v = Math.max(-1, Math.min(1, (clientX - (r.left + r.width / 2)) / (r.width / 2)));
    setKnob(v);
    world.touch.steer = v;
  };
  return (
    <div className="absolute inset-x-3 bottom-4 flex items-end justify-between">
      <div
        ref={base}
        className="pointer-events-auto relative h-24 w-44 touch-none rounded-full border border-hi/20 bg-ink/70"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); audio.ensure(); move(e.clientX); }}
        onPointerMove={(e) => { if (e.buttons || e.pointerType === "touch") move(e.clientX); }}
        onPointerUp={() => { setKnob(0); world.touch.steer = 0; }}
        onPointerCancel={() => { setKnob(0); world.touch.steer = 0; }}
      >
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border-2 border-neon bg-neon/20 glow-neon-soft" style={{ transform: `translate(calc(-50% + ${knob * 56}px), -50%)` }} />
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest text-chrome/60">DIREÇÃO</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Pedal label="DRIFT" className="h-14 w-20" onChange={(v) => (world.touch.handbrake = v)} />
        <Pedal label="R" className="h-14 w-20" onChange={(v) => (world.touch.limiter = v)} />
        <Pedal label="FREIO" className="h-20 w-20" onChange={(v) => (world.touch.brake = v ? 1 : 0)} />
        <Pedal label="GÁS" className="h-20 w-20 border-neon" onChange={(v) => (world.touch.throttle = v ? 1 : 0)} />
      </div>
    </div>
  );
}
