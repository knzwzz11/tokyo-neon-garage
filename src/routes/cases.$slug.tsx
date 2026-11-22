import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ApexSite } from "@/components/cases/ApexSite";
import { BurgerSite } from "@/components/cases/BurgerSite";
import { KyotoSite } from "@/components/cases/KyotoSite";
import { caseBySlug, whatsappUrl } from "@/data/portfolio";
import { IconWhats } from "@/components/kit/icons";

export const Route = createFileRoute("/cases/$slug")({
  loader: ({ params }) => {
    const c = caseBySlug(params.slug);
    if (!c) throw notFound();
    return { slug: c.slug };
  },
  head: ({ loaderData }) => {
    const c = loaderData ? caseBySlug(loaderData.slug) : undefined;
    if (!c) return { meta: [{ title: "Case indisponível — Kauan Ribeiro Rojas" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${c.name} — case ao vivo por Kauan Ribeiro Rojas` },
        { name: "description", content: c.summary },
        { property: "og:title", content: `${c.name} — case ao vivo` },
        { property: "og:description", content: c.summary },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CasePage,
});

function CasePage() {
  const { slug } = Route.useLoaderData();
  const c = caseBySlug(slug)!;
  return (
    <div className="fixed inset-0 flex flex-col bg-ink font-hud">
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-hi/10 bg-ink px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2 text-[12px] font-bold tracking-wider text-chrome hover:text-hi">
          <span className="h-4 w-1.5 bg-neon" /> ← VOLTAR À GARAGEM
        </Link>
        <span className="hidden truncate text-[11px] tracking-[0.25em] text-chrome/60 md:block">CASE AO VIVO · BAY {c.bay} · DESIGN POR KAUAN RIBEIRO ROJAS</span>
        <a href={whatsappUrl(`Olá Kauan! Vi o case ${c.name} e quero algo parecido.`)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold tracking-wider text-neon">
          <IconWhats /> <span className="hidden sm:inline">QUERO UM ASSIM</span>
        </a>
      </div>
      <div className="flex-1 overflow-y-auto">
        {c.slug === "smash-drift-burger" ? <BurgerSite /> : c.slug === "kyoto-retreat" ? <KyotoSite /> : <ApexSite />}
      </div>
    </div>
  );
}
