import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { audio } from "@/game/audio/audio";
import { closeModal } from "@/game/actions";
import { useUI } from "@/game/store";
import { CASES, caseBySlug, PROFILE, whatsappUrl, type CaseStudy } from "@/data/portfolio";
import { Avatar, Badge, Chip, Kbd, primaryClass, SecondaryButton, secondaryClass, SectionTitle, StatCard } from "@/components/kit/parts";
import { IconArrowUpRight } from "@/components/kit/icons";
import { IconChevron, IconDownload, IconPhone, IconWhats } from "@/components/kit/icons";
import { cn } from "@/lib/utils";

function Shell({ children, label, wide = true, footer }: { children: ReactNode; label: string; wide?: boolean; footer: { hint: string } }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); closeModal(); } };
    window.addEventListener("keydown", onKey, true);
    panel.current?.focus();
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);
  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-ink/70 p-3 backdrop-blur-sm md:items-center md:p-8" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn("relative w-full rounded-[10px] border border-hi/10 bg-panel/95 shadow-2xl outline-none animate-in fade-in zoom-in-95 duration-300", wide ? "max-w-[1180px]" : "max-w-[560px]")}
      >
        {children}
        <div className="flex items-center justify-between gap-3 border-t border-hi/10 px-5 py-3 md:px-6">
          <button onClick={closeModal} className="flex items-center gap-3 text-[12px] font-semibold tracking-wider text-chrome hover:text-hi">
            <Kbd>ESC</Kbd>
            {footer.hint}
          </button>
          <span className="hidden text-[11px] tracking-widest text-chrome/40 md:block">{PROFILE.name}</span>
        </div>
      </div>
    </div>
  );
}

// ---- Drawers -------------------------------------------------------------------
function DrawersModal() {
  const open = useUI((s) => s.open);
  return (
    <Shell label="Projetos & Cases de Design" wide={false} footer={{ hint: "Fechar gavetas & voltar à garagem" }}>
      <div className="p-5 md:p-6">
        <div className="font-display text-[11px] tracking-[0.25em] text-aura">[GAVETAS]</div>
        <h2 className="mt-1 font-display text-[22px] text-hi">Projetos & Cases de Design</h2>
        <p className="mt-2 text-[14px] text-chrome/70">Cada gaveta do carrinho guarda um case. Abra uma para inspecionar.</p>
        <div className="mt-5 flex flex-col gap-2">
          {CASES.map((c, i) => (
            <button
              key={c.slug}
              onClick={() => { audio.click(1400); open({ kind: "case", slug: c.slug }); }}
              className="group flex items-center gap-4 rounded-[6px] border border-hi/10 bg-ink/60 p-3 text-left transition-all hover:translate-x-1 hover:border-pink"
            >
              <img src={c.cover} alt="" className="h-14 w-20 rounded-[4px] object-cover" loading="lazy" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold tracking-[0.3em] text-chrome/50">GAVETA {String(i + 1).padStart(2, "0")} · {c.tag}</div>
                <div className="truncate font-semibold tracking-wide text-hi">{c.name}</div>
                <div className="text-[12px] text-chrome/60">{c.role}</div>
              </div>
              <IconChevron className="text-chrome/40 group-hover:text-pink" />
            </button>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// ---- Case study ----------------------------------------------------------------
function Wireframe({ kind, i, big = false }: { kind: string; i: number; big?: boolean }) {
  const stroke = "var(--chrome)";
  return (
    <div className={cn("rounded-[6px] border border-hi/10 bg-ink/70 p-2", big && "p-4")}>
      <svg viewBox="0 0 90 160" className="w-full">
        <rect x="2" y="2" width="86" height="156" rx="10" fill="none" stroke={stroke} strokeOpacity="0.35" />
        <rect x="10" y="12" width="40" height="5" rx="2" fill={stroke} fillOpacity="0.4" />
        {i % 2 === 0 ? (
          <>
            <circle cx="45" cy="58" r="26" fill="none" stroke="var(--neon)" strokeOpacity="0.7" />
            <rect x="12" y="96" width="30" height="20" rx="3" fill={stroke} fillOpacity="0.15" />
            <rect x="48" y="96" width="30" height="20" rx="3" fill={stroke} fillOpacity="0.15" />
          </>
        ) : (
          <>
            <rect x="10" y="26" width="70" height="40" rx="4" fill={stroke} fillOpacity="0.15" />
            {[74, 88, 102].map((y) => <rect key={y} x="10" y={y} width="70" height="9" rx="2" fill={stroke} fillOpacity="0.12" />)}
          </>
        )}
        <rect x="10" y="130" width="70" height="14" rx="4" fill="var(--pink)" fillOpacity="0.55" />
      </svg>
      <div className="mt-1 text-center text-[10px] font-bold tracking-widest text-chrome/60">{kind.toUpperCase()}</div>
    </div>
  );
}

function useSession(c: CaseStudy) {
  const [live, setLive] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 100);
    return () => window.clearInterval(id);
  }, [live]);
  const values = c.hud.map((h, i) => {
    if (!live) return h.value;
    const n = parseFloat(h.value.replace(/[^\d.]/g, ""));
    if (Number.isNaN(n)) return h.value;
    const wobble = n * (1 + Math.sin(tick * (0.4 + i * 0.3)) * 0.06);
    return h.value.replace(/[\d.]+/, wobble.toFixed(h.value.includes(".") ? 2 : 0));
  });
  const lap = live ? `${Math.floor(tick / 600)}:${String(Math.floor((tick / 10) % 60)).padStart(2, "0")}.${tick % 10}` : c.heroStat.value;
  return { live, setLive, values, lap };
}

function CaseModal({ slug }: { slug: CaseStudy["slug"] }) {
  const c = caseBySlug(slug) ?? CASES[0]!;
  const { live, setLive, values, lap } = useSession(c);
  const [proto, setProto] = useState<number | null>(null);
  const isApex = c.slug === "apex-telemetry";
  return (
    <Shell label={c.headerTitle} footer={{ hint: "Close Bay & Resume Drive" }}>
      <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-[8px] border border-hi/10">
            {proto === null ? (
              <img src={c.cover} alt={`${c.name} — mockup do projeto`} className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="grid aspect-[16/10] w-full grid-cols-[auto_1fr_auto] items-center gap-3 bg-ink p-4">
                <button onClick={() => setProto((p) => ((p ?? 0) + c.wireframes.length - 1) % c.wireframes.length)} className="grid h-10 w-10 place-items-center rounded-full border border-hi/15 hover:border-neon" aria-label="Tela anterior">
                  <IconChevron dir="left" />
                </button>
                <div className="mx-auto w-[34%] min-w-[120px]">
                  <Wireframe kind={c.wireframes[proto] ?? ""} i={proto} big />
                </div>
                <button onClick={() => setProto((p) => ((p ?? 0) + 1) % c.wireframes.length)} className="grid h-10 w-10 place-items-center rounded-full border border-hi/15 hover:border-neon" aria-label="Próxima tela">
                  <IconChevron />
                </button>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-ink/40" />
            <div className="absolute left-4 top-4 font-display text-[11px] tracking-[0.3em] text-neon">{c.showcase}</div>
            <div className="absolute right-4 top-4"><Badge className="bg-ink/85">{proto === null ? c.status : `PROTÓTIPO ${proto + 1} / ${c.wireframes.length}`}</Badge></div>
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end gap-3">
              <div className="rounded-[6px] border border-hi/10 bg-ink/80 px-4 py-3 backdrop-blur">
                <div className="text-[10px] font-bold tracking-[0.25em] text-chrome/60">{isApex ? "LAP 07 / 12" : c.heroStat.label}</div>
                <div className="font-display text-[30px] leading-none text-hi">{lap}</div>
              </div>
              {c.hud.map((h, i) => (
                <div key={h.label} className="rounded-[6px] border border-hi/10 bg-ink/80 px-4 py-3 backdrop-blur">
                  <div className="text-[10px] font-bold tracking-[0.25em] text-chrome/60">{h.label}</div>
                  <div className={cn("font-display text-[20px] leading-none", i === 0 ? "text-neon" : "text-pink")}>{values[i]}</div>
                </div>
              ))}
              <button
                onClick={() => { audio.click(live ? 900 : 1800); setLive((v) => !v); }}
                className={cn("pointer-events-auto ml-auto flex h-11 items-center gap-2 rounded-[6px] px-5 text-[13px] font-bold tracking-wider", live ? "border border-pink bg-pink/20 text-hi" : "bg-pink text-hi glow-pink")}
              >
                <span className={cn("h-2 w-2 rounded-full bg-hi", live && "animate-pulse")} />
                {live ? "SESSION LIVE" : "START SESSION"}
              </button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <div>
              <SectionTitle>WIREFRAMES</SectionTitle>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {c.wireframes.map((w, i) => (
                  <button key={w} onClick={() => setProto(i)} className="text-left transition-transform hover:-translate-y-0.5" aria-label={`Abrir tela ${w}`}>
                    <Wireframe kind={w} i={i} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <SectionTitle>NEON PALETTE</SectionTitle>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {c.palette.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => { void navigator.clipboard?.writeText(hex); toast(`${hex} copiado`); }}
                    className="flex items-center gap-2 rounded-[6px] border border-hi/10 bg-ink/60 p-2 text-left hover:border-neon"
                  >
                    <span className="h-8 w-8 rounded-[4px] border border-hi/15" style={{ background: hex }} />
                    <span className="font-display text-[12px] text-chrome">{hex}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-[12px] font-bold tracking-[0.25em] text-pink">ROLE: {c.role}</div>
            <h2 className="mt-2 font-display text-[28px] leading-tight text-hi md:text-[34px]">{c.name}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-chrome/80">{c.summary}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {c.metrics.map((m) => <StatCard key={m.label} value={m.value} label={m.label} className="p-4 [&>div:first-child]:text-[24px]" />)}
          </div>
          <div>
            <SectionTitle>TECH & TOOLS</SectionTitle>
            <div className="mt-3 flex flex-wrap gap-2">{c.tools.map((t) => <Chip key={t}>{t}</Chip>)}</div>
          </div>
          <div className="mt-auto flex flex-col gap-2">
            <Link to="/cases/$slug" params={{ slug: c.slug }} className={primaryClass("w-full")}>
              LAUNCH LIVE CASE <IconArrowUpRight />
            </Link>
            <SecondaryButton className="w-full" onClick={() => setProto((p) => (p === null ? 0 : null))}>
              {proto === null ? "View Figma Prototype" : "Voltar ao mockup"}
            </SecondaryButton>
            <a href={whatsappUrl(`Olá Kauan! Quero conversar sobre o case ${c.name}.`)} target="_blank" rel="noreferrer" className="mt-1 flex items-center justify-center gap-2 text-[13px] font-semibold text-neon hover:underline">
              <IconWhats /> Conversar sobre esse case no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ---- Bio (portrait easter egg) --------------------------------------------------
function BioModal() {
  return (
    <Shell label="Ficha de piloto — Kauan Ribeiro Rojas" footer={{ hint: "ESC / CLIQUE FORA · Voltar à órbita 360° da garagem" }}>
      <div className="grid gap-6 p-5 md:grid-cols-[360px_1fr] md:p-6">
        <div className="relative overflow-hidden rounded-[8px] border border-hi/10 bg-ink">
          <img src={PROFILE.portraitUrl} alt="Kauan Ribeiro Rojas" className="aspect-[4/5] w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
          <div className="absolute left-3 right-3 top-3 flex justify-between">
            <span className="rounded-[4px] bg-ink/80 px-2 py-1 font-display text-[11px] tracking-[0.2em] text-neon">ETEC P. BELÉM</span>
            <span className="rounded-[4px] bg-ink/80 px-2 py-1 font-display text-[11px] tracking-[0.2em] text-chrome">ID 0877</span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <Badge className="border-aura bg-aura/20 text-aura">CAPACETE // DISSIPANDO</Badge>
            <Avatar>KR</Avatar>
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <div>
            <SectionTitle>FICHA DE PILOTO // DESIGNER</SectionTitle>
            <h2 className="mt-3 font-display text-[30px] leading-tight text-hi md:text-[40px]">{PROFILE.name}</h2>
            <p className="mt-2 text-[15px] font-semibold text-neon">{PROFILE.headline}</p>
            <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-chrome/80">{PROFILE.manifesto}</p>
          </div>
          <div>
            <SectionTitle>STACK</SectionTitle>
            <div className="mt-3 flex flex-wrap gap-2">{PROFILE.stack.map((s) => <Chip key={s}>{s}</Chip>)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:max-w-[420px]">
            <StatCard value={String(CASES.length).padStart(2, "0")} label="CASES NO PORTFÓLIO" />
            <StatCard value="ETEC" label="FORMAÇÃO" />
          </div>
          <div className="mt-auto flex flex-col gap-2 sm:flex-row">
            <a href={whatsappUrl("Olá Kauan! Vi seu portfólio e quero conversar.")} target="_blank" rel="noreferrer" className={primaryClass("flex-1 px-4")}>
              <IconWhats /> Conversar no WhatsApp: {PROFILE.phoneDisplay}
            </a>
            <a href={PROFILE.cvUrl} download="Kauan-Ribeiro-Rojas-CV.pdf" target="_blank" rel="noreferrer" className={secondaryClass()}>
              <IconDownload /> Download CV
            </a>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ---- Phone ---------------------------------------------------------------------
function PhoneModal() {
  const [copied, setCopied] = useState(false);
  return (
    <Shell label="Contato Direto & WhatsApp" wide={false} footer={{ hint: "Desligar & voltar à garagem" }}>
      <div className="p-5 text-center md:p-8">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-aura bg-aura/15 text-aura animate-aura">
          <IconPhone size={34} className="animate-ring" />
        </div>
        <div className="mt-4 font-display text-[11px] tracking-[0.25em] text-aura">[TELEFONE]</div>
        <h2 className="mt-1 font-display text-[22px] text-hi">Contato Direto & WhatsApp</h2>
        <div className="mt-4 font-display text-[34px] tracking-wide text-hi md:text-[40px]">{PROFILE.phoneDisplay}</div>
        <p className="mt-1 text-[13px] text-chrome/60">São Paulo, SP · responde rápido no WhatsApp</p>
        <div className="mt-6 flex flex-col gap-2">
          <a href={whatsappUrl("Olá Kauan! Vi seu portfólio na garagem 3D e quero conversar sobre um projeto.")} target="_blank" rel="noreferrer" className={primaryClass("w-full")}>
            <IconWhats /> ABRIR WHATSAPP
          </a>
          <div className="grid grid-cols-2 gap-2">
            <a href={`tel:+${PROFILE.phoneE164}`} className={secondaryClass()}>
              <IconPhone /> LIGAR
            </a>
            <SecondaryButton
              onClick={() => {
                void navigator.clipboard?.writeText(PROFILE.phoneDisplay).then(() => { setCopied(true); toast("Número copiado"); });
              }}
            >
              {copied ? "COPIADO" : "COPIAR NÚMERO"}
            </SecondaryButton>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function Modals() {
  const modal = useUI((s) => s.modal);
  if (!modal) return null;
  if (modal.kind === "drawers") return <DrawersModal />;
  if (modal.kind === "case") return <CaseModal key={modal.slug} slug={modal.slug} />;
  if (modal.kind === "bio") return <BioModal />;
  return <PhoneModal />;
}
