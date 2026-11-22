// Parts from the Underground Car Meet UI kit, on the app's semantic tokens.
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconArrowUpRight } from "./icons";

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 font-hud", className)}>
      <span className="h-4 w-1.5 bg-pink" />
      <span className="text-[11px] font-bold tracking-[0.3em] text-chrome/60">{children}</span>
    </div>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-8 items-center rounded-[6px] border border-hi/15 bg-panel px-3 font-hud text-[12px] font-semibold tracking-wider text-chrome hover:border-neon", className)}>
      {children}
    </span>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-7 items-center gap-2 rounded-[4px] border border-pink bg-pink/15 px-3 font-hud text-[11px] font-bold tracking-[0.2em] text-pink", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-pink glow-pink" />
      {children}
    </span>
  );
}

export function StatCard({ value, label, className }: { value: ReactNode; label: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[8px] border border-hi/10 bg-panel/85 p-5 font-hud", className)}>
      <div className="font-display text-[28px] leading-none text-hi">{value}</div>
      <div className="mt-2 text-[11px] font-bold tracking-[0.25em] text-chrome/60">{label}</div>
    </div>
  );
}

export const primaryClass = (extra?: string) =>
  cn(
    "flex h-11 items-center justify-center gap-2 rounded-[6px] bg-neon px-6 font-hud text-[13px] font-bold tracking-wider text-ink glow-neon transition-shadow hover:shadow-[0_0_32px_color-mix(in_oklab,var(--neon)_80%,transparent)] disabled:opacity-50",
    extra,
  );
export const secondaryClass = (extra?: string) =>
  cn("flex h-11 items-center justify-center gap-2 rounded-[6px] border border-hi/15 bg-transparent px-6 font-hud text-[13px] font-semibold tracking-wider text-hi hover:border-pink", extra);

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; icon?: ReactNode | false };

export function PrimaryButton({ children, className, icon, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-[6px] bg-neon px-6 font-hud text-[13px] font-bold tracking-wider text-ink glow-neon transition-shadow hover:shadow-[0_0_32px_color-mix(in_oklab,var(--neon)_80%,transparent)] disabled:opacity-50",
        className,
      )}
    >
      {children}
      {icon === false ? null : icon ?? <IconArrowUpRight />}
    </button>
  );
}

export function SecondaryButton({ children, className, icon, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cn("flex h-11 items-center justify-center gap-2 rounded-[6px] border border-hi/15 bg-transparent px-6 font-hud text-[13px] font-semibold tracking-wider text-hi hover:border-pink", className)}
    >
      {children}
      {icon || null}
    </button>
  );
}

export function Kbd({ children, pink = false, className }: { children: ReactNode; pink?: boolean; className?: string }) {
  return (
    <kbd
      className={cn(
        "grid h-7 min-w-7 place-items-center rounded-[4px] px-2 font-hud text-[11px] font-bold tracking-widest",
        pink ? "bg-pink text-hi" : "border border-hi/30 text-chrome",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function Avatar({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-neon/60 bg-panel font-display text-[14px] text-neon shadow-[0_0_12px_color-mix(in_oklab,var(--neon)_35%,transparent)]">
      {children}
    </span>
  );
}
