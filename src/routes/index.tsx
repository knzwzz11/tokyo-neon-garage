import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";
import { Header } from "@/components/hud/Header";
import { OrbitHud } from "@/components/hud/OrbitHud";
import { DriveHud } from "@/components/hud/DriveHud";
import { Modals } from "@/components/hud/Modals";
import { GridView } from "@/components/hud/GridView";
import { Loader } from "@/components/hud/Loader";
import { useUI } from "@/game/store";
import { audio } from "@/game/audio/audio";

const GameCanvas = lazy(() => import("@/game/GameCanvas"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kauan Ribeiro Rojas // Designer — Garagem 3D" },
      { name: "description", content: "Portfólio interativo de Kauan Ribeiro Rojas: garagem 3D estilo Tokyo car meet com R34, Supra, Eclipse e superbike para dirigir, drift e cases de design." },
      { property: "og:title", content: "Kauan Ribeiro Rojas // Designer — Garagem 3D" },
      { property: "og:description", content: "Dirija pela garagem, faça drift, corte giro e abra os cases de design de Kauan Ribeiro Rojas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const view = useUI((s) => s.view);
  const setView = useUI((s) => s.setView);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "2d") setView("2d");
    // Audio needs a user gesture before it can start.
    const unlock = () => { if (useUI.getState().audioOn) audio.ensure(); };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [setView]);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-ink font-hud text-foreground">
      <Header />
      <main className="relative flex-1 overflow-hidden">
        {view === "3d" ? (
          <>
            <ClientOnly fallback={null}>
              <Suspense fallback={null}>
                <GameCanvas />
              </Suspense>
            </ClientOnly>
            <Loader />
            <OrbitHud />
            <DriveHud />
          </>
        ) : (
          <GridView />
        )}
        <Modals />
      </main>
    </div>
  );
}
