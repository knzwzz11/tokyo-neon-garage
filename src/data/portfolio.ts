import burgerCover from "@/assets/case_burger.webp.asset.json";
import resortCover from "@/assets/case_resort.webp.asset.json";
import apexCover from "@/assets/case_apex.webp.asset.json";
import portrait from "@/assets/kauan_portrait.jpg.asset.json";
import cvPdf from "@/assets/kauan-ribeiro-rojas-cv.pdf.asset.json";

export const PROFILE = {
  name: "KAUAN RIBEIRO ROJAS",
  role: "DESIGNER",
  phoneDisplay: "(11) 93026-0877",
  phoneE164: "5511930260877",
  education: "Técnico em Informática para Internet (ETEC)",
  school: "ETEC P. BELÉM",
  headline: "Product Designer & Técnico em Informática para Internet (ETEC)",
  manifesto:
    "Paixão por interfaces imersivas, estética automotiva veloz e soluções digitais de alto impacto — do Figma ao asfalto em WebGL.",
  stack: ["Figma", "Three.js/WebGL", "React", "Design Tokens", "UX Research"],
  focus: ["UI/UX", "Product Design", "3D", "Web Design"],
  portraitUrl: portrait.url,
  cvUrl: cvPdf.url,
};

export function whatsappUrl(message: string) {
  return `https://wa.me/${PROFILE.phoneE164}?text=${encodeURIComponent(message)}`;
}

export type CaseStudy = {
  slug: "apex-telemetry" | "smash-drift-burger" | "kyoto-retreat";
  bay: string;
  headerTitle: string;
  short: string;
  name: string;
  tag: string;
  showcase: string;
  status: string;
  cover: string;
  summary: string;
  role: string;
  hud: { label: string; value: string }[];
  heroStat: { label: string; value: string };
  palette: string[];
  metrics: { value: string; label: string }[];
  tools: string[];
  wireframes: string[];
};

export const CASES: CaseStudy[] = [
  {
    slug: "apex-telemetry",
    bay: "01",
    headerTitle: "GARAGE BAY 01 // APEX TELEMETRICS APP",
    short: "APEX",
    name: "Apex Telemetry",
    tag: "TELEMETRIA",
    showcase: "SHOWCASE // APEX v2.4",
    status: "BAY 01 · PARKED",
    cover: apexCover.url,
    summary:
      "Dashboard automotivo de performance: telemetria ao vivo, g-force, temperatura de pneus e comparação de voltas para pilotos de track day.",
    role: "Lead Product Designer",
    heroStat: { label: "LAP 07 / 12", value: "1:42.8" },
    hud: [
      { label: "G-FORCE", value: "1.34g" },
      { label: "TYRE TEMP", value: "96°C" },
    ],
    palette: ["#1FB6FF", "#FF2E88", "#C9D1DC", "#06070B"],
    metrics: [
      { value: "+185%", label: "ENGAGEMENT" },
      { value: "4.9", label: "APP STORE RATING" },
      { value: "0.8s", label: "TASK COMPLETION" },
    ],
    tools: ["Figma", "Spline 3D", "Design Tokens", "Prototyping"],
    wireframes: ["Live", "Voltas", "Pneus", "Pista"],
  },
  {
    slug: "smash-drift-burger",
    bay: "02",
    headerTitle: "GARAGE BAY 02 // SMASH & DRIFT BURGER",
    short: "HAMBURGUERIA",
    name: "Smash & Drift Burger",
    tag: "HAMBURGUERIA",
    showcase: "SHOWCASE // SMASH v1.8",
    status: "BAY 02 · PARKED",
    cover: burgerCover.url,
    summary:
      "App de delivery para hamburgueria artesanal com identidade visual completa: cardápio, montagem do burger, checkout em 3 passos e rastreio do motoboy.",
    role: "Product & Brand Designer",
    heroStat: { label: "PEDIDO #2041", value: "18 min" },
    hud: [
      { label: "TICKET MÉDIO", value: "R$ 54" },
      { label: "CHECKOUT", value: "3 passos" },
    ],
    palette: ["#FF7A1A", "#FFC93C", "#1A1A1A", "#FFF4E0"],
    metrics: [
      { value: "+62%", label: "PEDIDOS NO APP" },
      { value: "4.8", label: "AVALIAÇÃO" },
      { value: "-40%", label: "ABANDONO DE CARRINHO" },
    ],
    tools: ["Figma", "Identidade Visual", "Design Tokens", "Prototyping"],
    wireframes: ["Cardápio", "Montagem", "Checkout", "Rastreio"],
  },
  {
    slug: "kyoto-retreat",
    bay: "03",
    headerTitle: "GARAGE BAY 03 // KYOTO RETREAT & RESORT",
    short: "HOSPEDAGEM",
    name: "Kyoto Retreat & Resort",
    tag: "HOSPEDAGEM",
    showcase: "SHOWCASE // KYOTO v3.1",
    status: "BAY 03 · PARKED",
    cover: resortCover.url,
    summary:
      "Plataforma de reservas para hotel boutique de luxo: busca por datas, galeria imersiva dos quartos, experiência onsen e checkout sem atrito.",
    role: "UI/UX Designer",
    heroStat: { label: "OCUPAÇÃO", value: "92%" },
    hud: [
      { label: "DIÁRIA MÉDIA", value: "¥ 48k" },
      { label: "RESERVA", value: "2 min" },
    ],
    palette: ["#C8A96A", "#F3EBDD", "#1B2238", "#0B0E16"],
    metrics: [
      { value: "+48%", label: "RESERVAS DIRETAS" },
      { value: "4.9", label: "AVALIAÇÃO" },
      { value: "2 min", label: "TEMPO DE RESERVA" },
    ],
    tools: ["Figma", "UX Research", "Design Tokens", "Prototyping"],
    wireframes: ["Busca", "Quartos", "Onsen", "Checkout"],
  },
];

export function caseBySlug(slug: string) {
  return CASES.find((c) => c.slug === slug);
}
