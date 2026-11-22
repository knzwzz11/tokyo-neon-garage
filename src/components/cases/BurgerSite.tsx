import { useState } from "react";
import { cn } from "@/lib/utils";

const MENU = [
  { id: "drift", name: "The Drift", desc: "Smash duplo, cheddar, picles e molho da casa.", price: 34.9 },
  { id: "inferno", name: "The Inferno", desc: "Pepper jack, jalapeño e aioli picante.", price: 37.9 },
  { id: "classic", name: "The Classic", desc: "Smash simples, queijo prato, alface e tomate.", price: 28.9 },
  { id: "beast", name: "The BBQ Beast", desc: "Triplo, bacon, barbecue e cebola crispy.", price: 42.9 },
];
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function BurgerArt({ size = 1 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center" style={{ transform: `scale(${size})` }}>
      <div className="h-16 w-56 rounded-t-[120px] bg-burger-gold shadow-[inset_0_-10px_0_color-mix(in_oklab,var(--burger)_60%,transparent)]" />
      <div className="h-3 w-60 rounded-full bg-burger" />
      <div className="h-7 w-56 rounded-[14px] bg-burger-patty" />
      <div className="-my-1 h-4 w-60 rounded-[4px] bg-burger-gold" />
      <div className="h-7 w-56 rounded-[14px] bg-burger-patty" />
      <div className="h-10 w-56 rounded-b-[40px] bg-burger-gold" />
    </div>
  );
}

export function BurgerSite() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const items = MENU.filter((m) => cart[m.id]);
  const subtotal = items.reduce((s, m) => s + m.price * (cart[m.id] ?? 0), 0);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const add = (id: string, d: number) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + d) }));
  return (
    <div className="min-h-full bg-burger-ink font-hud text-burger-cream">
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="font-display text-[20px] leading-none text-burger">SMASH <span className="text-burger-cream">&</span> DRIFT<div className="text-[11px] tracking-[0.4em] text-burger-cream/70">BURGER</div></div>
        <div className="hidden gap-8 text-[14px] text-burger-cream/80 md:flex"><span>Cardápio</span><span>Combos</span><span>Lojas</span></div>
        <div className="rounded-full bg-burger px-4 py-2 text-[13px] font-bold text-burger-ink">Sacola · {count}</div>
      </nav>
      <section className="grid items-center gap-10 px-6 py-10 md:grid-cols-2 md:px-12 md:py-16">
        <div>
          <div className="text-[12px] font-bold tracking-[0.3em] text-burger-gold">SMASH ARTESANAL · ZONA LESTE</div>
          <h1 className="mt-3 font-display text-[48px] leading-[0.95] text-burger md:text-[76px]">Crocante na borda. Suculento no meio.</h1>
          <p className="mt-4 max-w-[440px] text-[16px] text-burger-cream/80">Hambúrguer prensado na chapa a 230°C, entregue em até 25 minutos.</p>
        </div>
        <div className="grid place-items-center py-6"><BurgerArt /></div>
      </section>
      <section className="grid gap-8 px-6 pb-16 md:grid-cols-[1fr_340px] md:px-12">
        <div>
          <h2 className="font-display text-[22px] text-burger-cream">Nossos smash</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {MENU.map((m) => (
              <div key={m.id} className="rounded-[14px] border border-burger-cream/10 bg-burger-cream/5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-display text-[18px] text-burger-cream">{m.name}</div>
                  <div className="font-bold text-burger-gold">{brl(m.price)}</div>
                </div>
                <p className="mt-1 text-[13px] text-burger-cream/70">{m.desc}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => add(m.id, -1)} className="h-9 w-9 rounded-full border border-burger-cream/20" aria-label={`Remover ${m.name}`}>−</button>
                  <span className="w-6 text-center font-bold">{cart[m.id] ?? 0}</span>
                  <button onClick={() => add(m.id, 1)} className="h-9 rounded-full bg-burger px-4 text-[13px] font-bold text-burger-ink">+ Adicionar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <aside className="h-fit rounded-[14px] border border-burger-cream/10 bg-burger-cream/5 p-5">
          <div className="flex gap-2 text-[11px] font-bold tracking-widest">
            {["SACOLA", "ENTREGA", "PAGO"].map((s, i) => (
              <span key={s} className={cn("flex-1 rounded-full py-1 text-center", i <= step ? "bg-burger text-burger-ink" : "bg-burger-cream/10 text-burger-cream/50")}>{s}</span>
            ))}
          </div>
          {step === 2 ? (
            <div className="mt-6 text-center">
              <div className="font-display text-[22px] text-burger">Pedido #2041 a caminho!</div>
              <p className="mt-2 text-[14px] text-burger-cream/70">Motoboy saiu da loja · chega em 18 min.</p>
              <button onClick={() => { setCart({}); setStep(0); }} className="mt-4 text-[13px] underline">Fazer outro pedido</button>
            </div>
          ) : items.length === 0 ? (
            <p className="mt-6 text-[14px] text-burger-cream/60">Sua sacola está vazia. Adicione um smash para começar.</p>
          ) : (
            <>
              <div className="mt-4 flex flex-col gap-2">
                {items.map((m) => (
                  <div key={m.id} className="flex justify-between text-[14px]"><span>{cart[m.id]}× {m.name}</span><span>{brl(m.price * (cart[m.id] ?? 0))}</span></div>
                ))}
              </div>
              <div className="mt-4 flex justify-between border-t border-burger-cream/10 pt-3 text-[14px] text-burger-cream/70"><span>Entrega</span><span>{brl(6.9)}</span></div>
              <div className="mt-1 flex justify-between font-display text-[22px] text-burger-gold"><span>Total</span><span>{brl(subtotal + 6.9)}</span></div>
              <button onClick={() => setStep((s) => (s === 0 ? 1 : 2))} className="mt-4 h-12 w-full rounded-full bg-burger font-bold text-burger-ink">
                {step === 0 ? "Continuar para entrega" : "Pagar com Pix"}
              </button>
            </>
          )}
        </aside>
      </section>
    </div>
  );
}
