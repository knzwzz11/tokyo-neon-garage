import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const ROOMS = [
  { id: "deluxe", name: "Ryokan Deluxe", info: "Vista para o jardim · até 3 hóspedes", price: 48000 },
  { id: "suite", name: "Suíte Premium com Onsen", info: "Onsen privativo · até 4 hóspedes", price: 86000 },
  { id: "tea", name: "Casa de Chá Privativa", info: "Pavilhão isolado · até 2 hóspedes", price: 120000 },
];
const yen = (n: number) => `¥ ${n.toLocaleString("pt-BR")}`;

export function KyotoSite() {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const [checkIn, setCheckIn] = useState(iso(new Date(today.getTime() + 7 * 864e5)));
  const [checkOut, setCheckOut] = useState(iso(new Date(today.getTime() + 10 * 864e5)));
  const [guests, setGuests] = useState(2);
  const [searched, setSearched] = useState(false);
  const [booked, setBooked] = useState<string | null>(null);
  const nights = useMemo(() => Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 864e5)), [checkIn, checkOut]);
  const invalid = nights < 1;
  return (
    <div className="min-h-full bg-kyoto-ink font-hud text-kyoto-cream">
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="font-serif text-[24px] text-kyoto-cream">Kyoto Retreat <span className="text-kyoto-gold">&</span> Resort</div>
        <div className="hidden gap-8 text-[13px] tracking-widest text-kyoto-cream/70 md:flex"><span>QUARTOS</span><span>ONSEN</span><span>GASTRONOMIA</span></div>
      </nav>
      <section className="relative px-6 py-16 md:px-12 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,color-mix(in_oklab,var(--kyoto-gold)_18%,transparent),transparent_60%)]" />
        <div className="relative max-w-[640px]">
          <div className="text-[12px] tracking-[0.4em] text-kyoto-gold">RYOKAN · ONSEN · LUXO</div>
          <h1 className="mt-4 font-serif text-[48px] leading-[1.02] md:text-[72px]">Estadias atemporais no coração de Kyoto.</h1>
          <p className="mt-4 text-[16px] text-kyoto-cream/70">Hospitalidade tradicional, fontes termais naturais e jantares kaiseki da estação.</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!invalid) { setSearched(true); setBooked(null); } }}
          className="relative mt-10 grid gap-3 rounded-[10px] border border-kyoto-gold/30 bg-kyoto-navy/70 p-4 backdrop-blur md:grid-cols-[1fr_1fr_140px_auto]"
        >
          <label className="flex flex-col gap-1 text-[11px] tracking-widest text-kyoto-cream/60">CHECK-IN
            <input type="date" value={checkIn} min={iso(today)} onChange={(e) => setCheckIn(e.target.value)} className="h-10 rounded-[6px] bg-kyoto-ink px-3 text-[14px] text-kyoto-cream outline-none focus:ring-1 focus:ring-kyoto-gold" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] tracking-widest text-kyoto-cream/60">CHECK-OUT
            <input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} className="h-10 rounded-[6px] bg-kyoto-ink px-3 text-[14px] text-kyoto-cream outline-none focus:ring-1 focus:ring-kyoto-gold" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] tracking-widest text-kyoto-cream/60">HÓSPEDES
            <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="h-10 rounded-[6px] bg-kyoto-ink px-3 text-[14px] text-kyoto-cream outline-none">
              {[1, 2, 3, 4].map((g) => <option key={g} value={g}>{g} {g > 1 ? "adultos" : "adulto"}</option>)}
            </select>
          </label>
          <button disabled={invalid} className="h-10 self-end rounded-[6px] bg-kyoto-gold px-6 text-[13px] font-bold tracking-wider text-kyoto-ink disabled:opacity-40">VER DISPONIBILIDADE</button>
          {invalid && <p className="text-[12px] text-kyoto-gold md:col-span-4">O check-out precisa ser depois do check-in.</p>}
        </form>
      </section>
      <section className="px-6 pb-16 md:px-12">
        {!searched ? (
          <p className="text-[14px] text-kyoto-cream/50">Escolha as datas para ver os quartos disponíveis.</p>
        ) : (
          <>
            <h2 className="font-serif text-[30px]">{nights} {nights > 1 ? "noites" : "noite"} · {guests} {guests > 1 ? "hóspedes" : "hóspede"}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {ROOMS.map((r, i) => {
                const fits = guests <= [3, 4, 2][i]!;
                return (
                  <div key={r.id} className={cn("rounded-[10px] border p-5", booked === r.id ? "border-kyoto-gold bg-kyoto-gold/10" : "border-kyoto-cream/10 bg-kyoto-navy/40")}>
                    <div className="font-serif text-[24px]">{r.name}</div>
                    <div className="text-[13px] text-kyoto-cream/60">{r.info}</div>
                    <div className="mt-4 text-[13px] text-kyoto-cream/60">{yen(r.price)} / noite</div>
                    <div className="font-serif text-[26px] text-kyoto-gold">{yen(r.price * nights)}</div>
                    <button
                      disabled={!fits}
                      onClick={() => setBooked(r.id)}
                      className="mt-4 h-10 w-full rounded-[6px] border border-kyoto-gold text-[12px] font-bold tracking-widest text-kyoto-gold hover:bg-kyoto-gold hover:text-kyoto-ink disabled:opacity-30"
                    >
                      {booked === r.id ? "RESERVA CONFIRMADA ✓" : fits ? "RESERVAR" : "NÃO COMPORTA"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
