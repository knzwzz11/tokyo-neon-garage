import { audio } from "@/game/audio/audio";
import { exitDrive } from "@/game/actions";
import { useUI } from "@/game/store";
import { caseBySlug, PROFILE, whatsappUrl } from "@/data/portfolio";
import { IconDrive, IconGrid, IconMusic, IconSound, IconWhats } from "@/components/kit/icons";
import { cn } from "@/lib/utils";

export function Header() {
  const view = useUI((s) => s.view);
  const modal = useUI((s) => s.modal);
  const setView = useUI((s) => s.setView);
  const audioOn = useUI((s) => s.audioOn);
  const musicOn = useUI((s) => s.musicOn);
  const setAudio = useUI((s) => s.setAudio);
  const setMusic = useUI((s) => s.setMusic);
  const webglFailed = useUI((s) => s.webglFailed);

  const caseStudy = modal?.kind === "case" ? caseBySlug(modal.slug) : undefined;
  const hero = view === "3d" && !caseStudy && modal?.kind !== "bio";
  const title = caseStudy ? (
    caseStudy.headerTitle
  ) : modal?.kind === "bio" ? (
    "EASTER EGG // PERFIL DE KAUAN RIBEIRO ROJAS"
  ) : (
    <>
      {PROFILE.name} <span className="hidden sm:inline"><span className="text-neon">//</span> <span className="text-chrome/70">{PROFILE.role}</span></span>
    </>
  );

  const go = (v: "3d" | "2d") => {
    if (v === "3d" && webglFailed) return;
    if (useUI.getState().mode === "drive") exitDrive();
    useUI.getState().close();
    setView(v);
  };

  const toggleAudio = () => {
    const next = !audioOn;
    audio.setEnabled(next);
    setAudio(next);
    if (!next && musicOn) { audio.setMusic(false); setMusic(false); }
  };
  const toggleMusic = () => {
    const next = !musicOn;
    if (next && !audioOn) { audio.setEnabled(true); setAudio(true); }
    audio.setMusic(next);
    setMusic(next);
  };

  return (
    <header className="relative z-40 flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-hi/10 bg-ink/70 px-4 backdrop-blur-md md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <span className="h-6 w-2 shrink-0 bg-neon" />
        <span className="truncate font-display text-[12px] tracking-normal sm:tracking-wide text-hi sm:text-[13px] md:text-[17px]">{title}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2 md:gap-5">
        <span className="hidden items-center gap-2 text-[12px] font-semibold tracking-[0.2em] text-chrome/80 xl:flex">
          <span className="h-2 w-2 rounded-full bg-online glow-online" />
          {hero ? "GARAGEM 360° LIVE" : "ONLINE (SP/BR)"}
        </span>
        <a
          className="hidden h-10 items-center gap-2 rounded-[6px] border border-hi/15 px-4 text-[13px] font-semibold text-hi hover:border-neon lg:flex"
          href={whatsappUrl("Olá Kauan! Vi seu portfólio na garagem 3D e quero conversar.")}
          target="_blank"
          rel="noreferrer"
        >
          <IconWhats />
          {PROFILE.phoneDisplay}
        </a>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleAudio}
            aria-pressed={audioOn}
            title={audioOn ? "AUDIO: ON" : "MUTE"}
            aria-label={audioOn ? "AUDIO: ON" : "MUTE"}
            className={cn("flex h-10 items-center gap-2 rounded-[6px] border px-2.5 text-[11px] font-bold tracking-wider md:px-3", audioOn ? "border-neon/60 text-neon" : "border-hi/15 text-chrome/60")}
          >
            <IconSound on={audioOn} />
            <span className="hidden 2xl:inline">{audioOn ? "AUDIO: ON" : "MUTE"}</span>
          </button>
          <button
            onClick={toggleMusic}
            aria-pressed={musicOn}
            title="Trilha phonk"
            aria-label="PHONK"
            className={cn("hidden h-10 items-center gap-2 rounded-[6px] border px-2.5 text-[11px] font-bold tracking-wider sm:flex md:px-3", musicOn ? "border-pink text-pink glow-pink" : "border-hi/15 text-chrome/60")}
          >
            <IconMusic />
            <span className="hidden 2xl:inline">PHONK</span>
          </button>
        </div>
        <div className="flex rounded-[8px] border border-hi/15 bg-panel p-1" role="tablist" aria-label="Modo de visualização">
          {(["3d", "2d"] as const).map((v) => {
            const active = view === v;
            return (
              <button
                key={v}
                role="tab"
                aria-label={v === "3d" ? "3D DRIVE MODE" : "GRID VIEW"}
                aria-selected={active}
                disabled={v === "3d" && webglFailed}
                onClick={() => go(v)}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-[6px] px-2.5 text-[13px] tracking-wider md:px-4 disabled:opacity-40",
                  active ? "bg-pink font-bold text-hi glow-pink" : "font-semibold text-chrome/60 hover:text-hi",
                )}
              >
                {v === "3d" ? <IconDrive /> : <IconGrid />}
                <span className="hidden sm:inline">{hero ? v.toUpperCase() : v === "3d" ? "3D DRIVE MODE" : "GRID VIEW"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
