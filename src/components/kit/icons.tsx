// Icons from the Underground Car Meet UI kit (stroke icons, currentColor).
type P = { className?: string; size?: number };
const base = (size = 15) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor" });

export const IconWhats = ({ size, className }: P) => (
  <svg {...base(size)} strokeWidth="1.8" className={className} aria-hidden><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" /></svg>
);
export const IconDrive = ({ size, className }: P) => (
  <svg {...base(size)} strokeWidth="2" className={className} aria-hidden><circle cx="12" cy="7" r="3" /><path d="M12 10v6M5 20h14l-2-4H7z" /></svg>
);
export const IconGrid = ({ size, className }: P) => (
  <svg {...base(size)} strokeWidth="2" className={className} aria-hidden><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></svg>
);
export const IconWheel = ({ size, className }: P) => (
  <svg {...base(size)} strokeWidth="2" className={className} aria-hidden><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2" /><path d="M12 4v6M5 15l5-2M19 15l-5-2" /></svg>
);
export const IconUser = ({ size, className }: P) => (
  <svg {...base(size)} strokeWidth="2" className={className} aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
export const IconArrowUpRight = ({ size, className }: P) => (
  <svg {...base(size)} strokeWidth="2" className={className} aria-hidden><path d="M7 17L17 7M9 7h8v8" /></svg>
);
export const IconArrowRight = ({ size, className }: P) => (
  <svg {...base(size)} strokeWidth="2" className={className} aria-hidden><path d="M4 12h14M13 6l6 6-6 6" /></svg>
);
export const IconSound = ({ size, className, on }: P & { on: boolean }) => (
  <svg {...base(size)} strokeWidth="2" className={className} aria-hidden>
    <path d="M4 9v6h4l5 4V5L8 9z" />
    {on ? <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /> : <path d="M17 9l5 6M22 9l-5 6" />}
  </svg>
);
export const IconMusic = ({ size, className }: P) => (
  <svg {...base(size)} strokeWidth="2" className={className} aria-hidden><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></svg>
);
export const IconChevron = ({ size, className, dir = "right" }: P & { dir?: "left" | "right" }) => (
  <svg {...base(size)} strokeWidth="2" className={className} aria-hidden><path d={dir === "right" ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} /></svg>
);
export const IconDownload = ({ size, className }: P) => (
  <svg {...base(size)} strokeWidth="2" className={className} aria-hidden><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
);
export const IconPhone = ({ size, className }: P) => (
  <svg {...base(size)} strokeWidth="1.8" className={className} aria-hidden><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>
);
