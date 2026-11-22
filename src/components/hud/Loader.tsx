import { useUI } from "@/game/store";

export function Loader() {
  const ready = useUI((s) => s.ready);
  const setView = useUI((s) => s.setView);
  if (ready) return null;
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-ink">
      <div className="flex w-[320px] flex-col items-center gap-4 text-center">
        <div className="font-display text-[11px] tracking-[0.35em] text-neon">GARAGEM 360° LIVE</div>
        <div className="font-display text-[22px] text-hi">Ligando os motores…</div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-hi/10">
          <div className="h-full w-1/3 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-pink glow-pink" style={{ animation: "loader-slide 1.2s ease-in-out infinite" }} />
        </div>
        <button onClick={() => setView("2d")} className="text-[12px] font-semibold tracking-wider text-chrome/60 underline-offset-4 hover:text-hi hover:underline">
          Prefere a versão GRID VIEW?
        </button>
      </div>
      <style>{`@keyframes loader-slide{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  );
}
