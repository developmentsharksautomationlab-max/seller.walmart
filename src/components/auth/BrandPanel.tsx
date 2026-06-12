import { Apple } from "lucide-react";
import WalmartLogo from "@/components/WalmartLogo";

// Left marketing rail of the auth screens. Recreated from the Walmart Seller
// login layout for this practice/demo app — hidden on small screens.
export default function BrandPanel() {
  return (
    <aside className="relative hidden w-full shrink-0 flex-col overflow-hidden bg-[#0a1f44] px-12 py-10 text-white lg:flex lg:w-[38%] lg:max-w-[620px]">
      <WalmartLogo size="lg" textClassName="text-white" />

      <div className="flex flex-1 flex-col items-center justify-center">
        <PhoneMockup />

        <div className="mt-10 max-w-sm text-center">
          <h2 className="text-3xl font-extrabold leading-tight">
            Manage your business
            <br />
            with Walmart Seller App.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Track orders, update listings, and monitor performance anytime,
            anywhere. Available for US Marketplace Sellers only.
          </p>
        </div>

        <div className="mt-8 flex items-center gap-5">
          <QrCode className="h-28 w-28 rounded-lg bg-white p-2" />
          <div className="flex flex-col gap-3">
            <StoreBadge store="apple" />
            <StoreBadge store="google" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function PhoneMockup() {
  return (
    <div className="relative flex items-center justify-center">
      {/* decorative backdrop */}
      <div className="absolute h-72 w-72 rounded-full bg-white/[0.04]" />
      <div className="absolute bottom-0 h-36 w-72 rounded-t-full bg-sky-400/10" />
      <Sparkle className="absolute -left-2 top-10 h-5 w-5 text-sky-300/70" />
      <Sparkle className="absolute right-0 top-4 h-3 w-3 text-sky-300/60" />
      <Sparkle className="absolute -right-1 bottom-14 h-4 w-4 text-sky-300/70" />

      {/* phone */}
      <div className="relative z-10 w-[208px] rounded-[2.2rem] border-[6px] border-slate-800 bg-slate-900 p-1.5 shadow-2xl">
        <div className="mx-auto mb-1 h-1.5 w-14 rounded-full bg-slate-700" />
        <div className="overflow-hidden rounded-[1.7rem] bg-white text-slate-700">
          {/* status bar */}
          <div className="flex items-center justify-between px-3 pt-2 text-[8px] font-semibold text-slate-800">
            <span>9:41</span>
            <span className="flex items-center gap-0.5">
              <span className="h-1.5 w-2.5 rounded-[1px] bg-slate-800" />
              <span className="h-1.5 w-2.5 rounded-[1px] bg-slate-800" />
              <span className="h-2 w-3 rounded-[2px] border border-slate-800" />
            </span>
          </div>

          {/* app header */}
          <div className="flex items-center justify-between px-3 pt-2">
            <span className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-[#0a1f44]">
                Walmart
              </span>
              <span className="text-[9px] text-wm-spark">✦</span>
            </span>
            <span className="text-[8px] text-slate-400">🔔 🇺🇸</span>
          </div>
          <p className="px-3 pt-1 text-[9px] font-bold text-slate-800">
            Hi, Shanghai Pets
          </p>

          {/* stat tiles */}
          <div className="grid grid-cols-3 gap-1 px-3 pt-1.5">
            {[
              ["Today's orders", "14"],
              ["Unshipped", "12"],
              ["Current bal.", "$112"],
            ].map(([label, value]) => (
              <div key={label} className="rounded bg-slate-100 px-1 py-1">
                <p className="text-[6px] leading-tight text-slate-500">
                  {label}
                </p>
                <p className="text-[10px] font-bold text-slate-800">{value}</p>
              </div>
            ))}
          </div>

          {/* sales card */}
          <div className="m-3 mt-2 rounded-lg border border-slate-200 p-2">
            <div className="flex items-center justify-between text-[6px] text-slate-500">
              <span className="rounded bg-slate-100 px-1 py-0.5">
                Item sales ▾
              </span>
              <span className="rounded bg-slate-100 px-1 py-0.5">Today ▾</span>
            </div>
            <div className="mt-1.5 flex items-end justify-between">
              <p className="text-[12px] font-extrabold text-slate-900">
                $5,109{" "}
                <span className="text-[7px] font-medium text-slate-400">
                  USD
                </span>
              </p>
              <span className="text-[7px] font-bold text-emerald-500">
                ↑ 4%
              </span>
            </div>
            <svg viewBox="0 0 120 36" className="mt-1 w-full" fill="none">
              <polyline
                points="0,28 18,24 34,26 52,16 70,20 88,10 104,14 120,6"
                stroke="#0071dc"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="120" cy="6" r="2.5" fill="#0071dc" />
            </svg>
            <div className="flex justify-between pt-1 text-[5px] text-slate-400">
              <span>12AM</span>
              <span>6AM</span>
              <span>12PM</span>
              <span>6PM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 0c.6 5.4 3.6 8.4 9 9-5.4.6-8.4 3.6-9 9-.6-5.4-3.6-8.4-9-9 5.4-.6 8.4-3.6 9-9z" />
    </svg>
  );
}

// Decorative QR placeholder (not scannable) — deterministic module grid,
// computed once at module load so it never changes between renders.
const QR_N = 25;

const QR_CELLS: [number, number][] = (() => {
  let seed = 20240611;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= QR_N - 8 && y < 8) || (x < 8 && y >= QR_N - 8);

  const cells: [number, number][] = [];
  for (let y = 0; y < QR_N; y++) {
    for (let x = 0; x < QR_N; x++) {
      if (inFinder(x, y)) continue;
      if (rand() > 0.52) cells.push([x, y]);
    }
  }
  return cells;
})();

const QR_FINDERS: [number, number][] = [
  [0, 0],
  [QR_N - 7, 0],
  [0, QR_N - 7],
];

function QrCode({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`-1 -1 ${QR_N + 2} ${QR_N + 2}`}
      className={className}
      role="img"
      aria-label="QR code to download the app"
    >
      <rect x={-1} y={-1} width={QR_N + 2} height={QR_N + 2} fill="#fff" />
      {QR_CELLS.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#0a1f44" />
      ))}
      {QR_FINDERS.map(([x, y]) => (
        <g key={`finder-${x}-${y}`}>
          <rect x={x} y={y} width={7} height={7} fill="#0a1f44" />
          <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
          <rect x={x + 2} y={y + 2} width={3} height={3} fill="#0a1f44" />
        </g>
      ))}
    </svg>
  );
}

function StoreBadge({ store }: { store: "apple" | "google" }) {
  const isApple = store === "apple";
  return (
    <a
      href="#"
      className="flex h-12 w-44 items-center gap-2 rounded-lg border border-white/15 bg-black px-3 transition-colors hover:bg-zinc-900"
    >
      {isApple ? (
        <Apple className="h-6 w-6 shrink-0 fill-white text-white" />
      ) : (
        <PlayIcon className="h-5 w-5 shrink-0" />
      )}
      <span className="flex flex-col leading-tight">
        <span className="text-[9px] text-slate-300">
          {isApple ? "Download on the" : "GET IT ON"}
        </span>
        <span className="text-sm font-semibold tracking-tight">
          {isApple ? "App Store" : "Google Play"}
        </span>
      </span>
    </a>
  );
}

function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M3 2.5v19l11-9.5z" fill="#00d2ff" />
      <path d="M3 2.5l11 9.5 4-3.5z" fill="#00f076" />
      <path d="M3 21.5l11-9.5 4 3.5z" fill="#ff3a44" />
      <path d="M14 12l4-3.5 4 2.3c1.3.8 1.3 1.6 0 2.4L18 15.5z" fill="#ffce00" />
    </svg>
  );
}
