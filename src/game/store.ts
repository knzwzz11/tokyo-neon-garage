import { create } from "zustand";
import type { VehicleId } from "./sim/specs";
import type { CaseStudy } from "@/data/portfolio";

export type HotspotId = "chest" | "portrait" | "phone";
export type Modal =
  | { kind: "drawers" }
  | { kind: "case"; slug: CaseStudy["slug"] }
  | { kind: "bio" }
  | { kind: "phone" }
  | null;

export type Telemetry = { speed: number; rpm: number; redline: number; gear: number; drifting: boolean; driftScore: number; x: number; z: number; yaw: number };

type UIState = {
  view: "3d" | "2d";
  mode: "orbit" | "drive";
  selected: VehicleId;
  modal: Modal;
  hovered: HotspotId | null;
  helmet: "on" | "falling" | "gone";
  audioOn: boolean;
  musicOn: boolean;
  ready: boolean;
  webglFailed: boolean;
  near: HotspotId | null;
  telemetry: Telemetry;
  setView: (v: "3d" | "2d") => void;
  setMode: (m: "orbit" | "drive") => void;
  select: (id: VehicleId) => void;
  open: (m: Modal) => void;
  close: () => void;
  setHovered: (h: HotspotId | null) => void;
  setHelmet: (h: UIState["helmet"]) => void;
  setAudio: (on: boolean) => void;
  setMusic: (on: boolean) => void;
  setReady: () => void;
  setWebglFailed: () => void;
  setNear: (h: HotspotId | null) => void;
  setTelemetry: (t: Telemetry) => void;
};

export const useUI = create<UIState>((set) => ({
  view: "3d",
  mode: "orbit",
  selected: "bike",
  modal: null,
  hovered: null,
  helmet: "on",
  audioOn: true,
  musicOn: false,
  ready: false,
  webglFailed: false,
  near: null,
  telemetry: { speed: 0, rpm: 0, redline: 8000, gear: 1, drifting: false, driftScore: 0, x: 0, z: 0, yaw: 0 },
  setView: (view) => set({ view, mode: "orbit", hovered: null }),
  setMode: (mode) => set({ mode }),
  select: (selected) => set({ selected }),
  open: (modal) => set({ modal, hovered: null }),
  close: () => set({ modal: null }),
  setHovered: (hovered) => set({ hovered }),
  setHelmet: (helmet) => set({ helmet }),
  setAudio: (audioOn) => set({ audioOn }),
  setMusic: (musicOn) => set({ musicOn }),
  setReady: () => set({ ready: true }),
  setWebglFailed: () => set({ webglFailed: true, view: "2d" }),
  setNear: (near) => set({ near }),
  setTelemetry: (telemetry) => set({ telemetry }),
}));

export const HOTSPOT_COPY: Record<HotspotId, { tag: string; title: string; chips?: string[] }> = {
  chest: { tag: "[GAVETAS]", title: "Projetos & Cases de Design", chips: ["HAMBURGUERIA", "HOSPEDAGEM"] },
  portrait: { tag: "[RETRATO]", title: "Sobre Kauan Ribeiro Rojas" },
  phone: { tag: "[TELEFONE]", title: "Contato Direto & WhatsApp" },
};

export const HOTSPOT_MODAL: Record<HotspotId, Modal> = {
  chest: { kind: "drawers" },
  portrait: { kind: "bio" },
  phone: { kind: "phone" },
};
