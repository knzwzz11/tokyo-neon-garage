import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import coupe from "@/assets/coupe_night.webp.asset.json";
import tyres from "@/assets/tyre_stack.webp.asset.json";
import sockets from "@/assets/socket_set.webp.asset.json";
import { CASES, PROFILE, whatsappUrl } from "@/data/portfolio";
import { SPECS, VEHICLE_ORDER } from "@/game/sim/specs";
import { useUI } from "@/game/store";
import { Badge, Chip, primaryClass, secondaryClass, SectionTitle, StatCard } from "@/components/kit/parts";
import { IconArrowRight, IconDownload, IconGrid, IconUser, IconWhats, IconWheel } from "@/components/kit/icons";
import { cn } from "@/lib/utils";

const PROCESS = [
  { n: "01", t: "Pesquisa & Briefing", d: "Entrevistas, benchmark e mapa de jornada para achar o problema certo antes de desenhar." },
  { n: "02", t: "Wireframes", d: "Fluxos de baixa fidelidade testados cedo, do papel ao Figma, sem apego ao pixel." },
  { n: "03", t: "Design System", d: "Tokens, componentes e grids que deixam o produto consistente e rápido de evoluir." },
  { n: "04", t: "Protótipo & Teste", d: "Protótipos navegáveis e 3D/WebGL quando a experiência pede impacto." },
];

const contactSchema = z.object({
  name: z.string().trim().min(2, "Diga seu nome").max(80, "Nome muito longo"),
  subject: z.string().trim().min(2, "Qual o assunto?").max(80, "Assunto muito longo"),
  message: z.string().trim().min(10, "Conte um pouco mais (mín. 10 caracteres)").max(1000, "Mensagem muito longa"),
});
type ContactErrors = Partial<Record<keyof z.infer<typeof contactSchema>, string>>;

function ContactForm() {
  const [errors, setErrors] = useState<ContactErrors>({});
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = contactSchema.safeParse(data);
    if (!parsed.success) {
      const errs: ContactErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof ContactErrors;
        if (!errs[k]) errs[k] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    const { name, subject, message } = parsed.data;
    window.open(whatsappUrl(`Olá Kauan! Sou ${name}.\nAssunto: ${subject}\n\n${message}`), "_blank", "noopener");
    setSent(true);
  };
  const field = (name: keyof ContactErrors, label: string, placeholder: string, area = false) => (
    <label className="flex flex-col gap-2 font-hud">
      <span className="text-[11px] font-bold tracking-[0.25em] text-chrome/60">{label}</span>
      {area ? (
        <textarea name={name} rows={4} placeholder={placeholder} className="rounded-[6px] border border-hi/15 bg-panel px-4 py-3 text-[14px] text-hi outline-none placeholder:text-chrome/50 focus:border-neon" />
      ) : (
        <input name={name} placeholder={placeholder} className="h-11 rounded-[6px] border border-hi/15 bg-panel px-4 text-[14px] text-hi outline-none placeholder:text-chrome/50 focus:border-neon" />
      )}
      {errors[name] && <span className="text-[12px] text-pink">{errors[name]}</span>}
    </label>
  );
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-[8px] border border-hi/10 bg-panel/60 p-5">
      {field("name", "NOME", "Seu nome")}
      {field("subject", "ASSUNTO", "Ex.: site para minha hamburgueria")}
      {field("message", "MENSAGEM", "Conte sobre o projeto, prazo e objetivo", true)}
      <button type="submit" className={primaryClass()}>
        ENVIAR PELO WHATSAPP <IconArrowRight />
      </button>
      {sent && <p className="text-[13px] text-online">Mensagem pronta no WhatsApp — é só tocar em enviar por lá.</p>}
    </form>
  );
}

const TABS = [
  { id: "drive", label: "DRIVE", icon: <IconWheel /> },
  { id: "projetos", label: "PROJETOS", icon: <IconGrid /> },
  { id: "sobre", label: "SOBRE", icon: <IconUser /> },
  { id: "contato", label: "CONTATO", icon: <IconWhats /> },
] as const;

export function GridView() {
  const open = useUI((s) => s.open);
  const setView = useUI((s) => s.setView);
  const webglFailed = useUI((s) => s.webglFailed);
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string>("projetos");

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); }),
      { root: el, rootMargin: "-40% 0px -55% 0px" },
    );
    el.querySelectorAll("section[id]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const go = (id: string) => {
    if (id === "drive") { if (!webglFailed) setView("3d"); return; }
    root.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={root} className="absolute inset-0 overflow-y-auto scroll-smooth pb-28">
      {webglFailed && (
        <div className="border-b border-pink/40 bg-pink/10 px-6 py-2 text-center text-[13px] text-hi">
          Seu navegador não liberou o modo 3D, então abrimos a versão GRID VIEW completa.
        </div>
      )}
      {/* Hero */}
      <section id="inicio" className="relative min-h-[560px] overflow-hidden">
        <img src={coupe.url} alt="Cupê clássico em garagem escura com neon azul" className="absolute inset-0 h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,transparent_20%,var(--ink)_80%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-ink to-transparent" />
        <div className="relative mx-auto flex max-w-[1180px] flex-col gap-5 px-6 pb-16 pt-20 md:px-8 md:pt-28">
          <div className="font-display text-[11px] tracking-[0.3em] text-neon">STAGE // SP UNDERGROUND MEET</div>
          <h1 className="max-w-[720px] font-display text-[40px] leading-[1.05] text-hi md:text-[64px]">
            {PROFILE.name}
          </h1>
          <p className="max-w-[560px] text-[17px] font-semibold text-neon">{PROFILE.headline}</p>
          <p className="max-w-[520px] text-[15px] leading-relaxed text-chrome/80">{PROFILE.manifesto}</p>
          <div className="flex flex-wrap gap-2">
            {PROFILE.focus.map((f) => <Chip key={f}>{f}</Chip>)}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={whatsappUrl("Olá Kauan! Vi seu portfólio e quero conversar.")} target="_blank" rel="noreferrer" className={primaryClass()}>
              <IconWhats /> {PROFILE.phoneDisplay}
            </a>
            <a href={PROFILE.cvUrl} download="Kauan-Ribeiro-Rojas-CV.pdf" target="_blank" rel="noreferrer" className={secondaryClass()}>
              <IconDownload /> Download CV
            </a>
            {!webglFailed && (
              <button onClick={() => setView("3d")} className={secondaryClass("border-pink/60")}>
                <IconWheel /> Entrar na garagem 3D
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1180px] flex-col gap-20 px-6 md:px-8">
        {/* Cases */}
        <section id="projetos" className="scroll-mt-6">
          <SectionTitle>PROJETOS & CASES DE DESIGN</SectionTitle>
          <h2 className="mt-3 font-display text-[28px] text-hi md:text-[36px]">Três bays, três produtos.</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {CASES.map((c) => (
              <button key={c.slug} onClick={() => open({ kind: "case", slug: c.slug })} className="group flex flex-col overflow-hidden rounded-[8px] border border-hi/10 bg-panel/85 text-left transition-all hover:-translate-y-1 hover:border-pink">
                <div className="relative overflow-hidden">
                  <img src={c.cover} alt={`${c.name} — mockup`} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute left-3 top-3"><Badge className="bg-ink/85">BAY {c.bay}</Badge></div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <div className="text-[10px] font-bold tracking-[0.3em] text-chrome/50">{c.tag} · {c.role}</div>
                  <div className="font-display text-[20px] text-hi">{c.name}</div>
                  <p className="text-[14px] leading-relaxed text-chrome/70">{c.summary}</p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="font-display text-[22px] text-neon">{c.metrics[0]?.value}</span>
                    <span className="flex items-center gap-1 text-[12px] font-bold tracking-wider text-chrome group-hover:text-pink">ABRIR CASE <IconArrowRight /></span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* About */}
        <section id="sobre" className="grid scroll-mt-6 gap-8 md:grid-cols-[360px_1fr]">
          <div className="relative overflow-hidden rounded-[8px] border border-hi/10">
            <img src={PROFILE.portraitUrl} alt="Kauan Ribeiro Rojas" loading="lazy" className="aspect-[4/5] w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink to-transparent p-4">
              <span className="font-display text-[11px] tracking-[0.2em] text-neon">ETEC P. BELÉM · ID 0877</span>
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <SectionTitle>FICHA DE PILOTO // DESIGNER</SectionTitle>
            <h2 className="font-display text-[28px] text-hi md:text-[36px]">{PROFILE.name}</h2>
            <p className="text-[16px] leading-relaxed text-chrome/80">{PROFILE.manifesto}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <StatCard value={String(CASES.length).padStart(2, "0")} label="CASES NO PORTFÓLIO" />
              <StatCard value="ETEC" label="FORMAÇÃO" />
              <StatCard value="3D" label="WEBGL & PRODUTO" />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-[0.25em] text-chrome/60">FORMAÇÃO</div>
              <p className="mt-1 text-[15px] text-hi">{PROFILE.education} — ETEC Parque Belém</p>
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-[0.25em] text-chrome/60">STACK</div>
              <div className="mt-2 flex flex-wrap gap-2">{PROFILE.stack.map((s) => <Chip key={s}>{s}</Chip>)}</div>
            </div>
          </div>
        </section>

        {/* Process */}
        <section id="processo" className="grid scroll-mt-6 items-center gap-8 md:grid-cols-[1fr_1fr]">
          <div>
            <SectionTitle>PROCESSO DE DESIGN</SectionTitle>
            <h2 className="mt-3 font-display text-[28px] text-hi md:text-[36px]">Do briefing à pista.</h2>
            <div className="mt-6 flex flex-col gap-2">
              {PROCESS.map((p) => (
                <div key={p.n} className="flex gap-4 rounded-[6px] border border-hi/10 bg-panel/80 p-4 hover:border-pink">
                  <span className="font-display text-chrome/50">{p.n}</span>
                  <div>
                    <div className="font-semibold tracking-wider text-hi">{p.t}</div>
                    <div className="text-[14px] text-chrome/70">{p.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <img src={sockets.url} alt="Jogo de soquetes em maleta" loading="lazy" className="aspect-[3/2] w-full rounded-[8px] border border-hi/10 object-cover" />
        </section>

        {/* Fleet */}
        <section id="garagem" className="grid scroll-mt-6 items-center gap-8 md:grid-cols-[320px_1fr]">
          <img src={tyres.url} alt="Pilha de pneus novos" loading="lazy" className="aspect-[2/3] w-full rounded-[8px] border border-hi/10 object-cover" />
          <div>
            <SectionTitle>A GARAGEM 3D</SectionTitle>
            <h2 className="mt-3 font-display text-[28px] text-hi md:text-[36px]">Quatro máquinas para dirigir.</h2>
            <p className="mt-3 max-w-[560px] text-[15px] text-chrome/70">No modo 3D você assume o volante, faz drift com o freio de mão e corta giro até as chamas saírem do escapamento.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {VEHICLE_ORDER.map((id) => {
                const s = SPECS[id];
                return (
                  <div key={id} className="rounded-[6px] border border-hi/10 bg-panel/80 p-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.underglow, boxShadow: `0 0 10px ${s.underglow}` }} />
                      <span className="font-semibold tracking-wide text-hi">{s.name}</span>
                    </div>
                    <div className="mt-1 text-[12px] tracking-wider text-chrome/60">{Math.round(s.topSpeed * 3.6)} KM/H · LIMITE {(s.redline / 1000).toFixed(0)}K RPM</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contato" className="grid scroll-mt-6 gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <SectionTitle>CONTATO DIRETO & WHATSAPP</SectionTitle>
            <h2 className="font-display text-[28px] text-hi md:text-[36px]">Bora acelerar seu projeto?</h2>
            <p className="text-[15px] text-chrome/70">Sites, apps, identidade visual e experiências 3D. Respondo rápido pelo WhatsApp.</p>
            <div className="font-display text-[34px] text-hi">{PROFILE.phoneDisplay}</div>
            <div className="flex flex-wrap gap-2">
              <a href={whatsappUrl("Olá Kauan! Vi seu portfólio e quero conversar.")} target="_blank" rel="noreferrer" className={primaryClass()}>
                <IconWhats /> ABRIR WHATSAPP
              </a>
              <a href={PROFILE.cvUrl} download="Kauan-Ribeiro-Rojas-CV.pdf" target="_blank" rel="noreferrer" className={secondaryClass()}>
                <IconDownload /> Download CV
              </a>
            </div>
          </div>
          <ContactForm />
        </section>
        <footer className="border-t border-hi/10 pb-24 pt-8 text-[12px] tracking-widest text-chrome/40">© 2026 {PROFILE.name} // DESIGNER · SÃO PAULO</footer>
      </div>

      <nav className="fixed bottom-5 left-1/2 z-30 flex h-14 -translate-x-1/2 items-center gap-1 rounded-full border border-hi/15 bg-ink/85 p-1 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => go(t.id)}
            data-active={active === t.id || undefined}
            className={cn(
              "flex h-11 items-center gap-2 rounded-full px-3 text-[12px] font-semibold tracking-wider text-chrome/60 hover:text-hi sm:px-5 sm:text-[13px]",
              "data-[active]:bg-pink data-[active]:text-hi data-[active]:glow-pink",
            )}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
