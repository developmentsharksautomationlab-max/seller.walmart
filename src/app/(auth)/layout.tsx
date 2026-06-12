import Link from "next/link";
import { ChevronDown } from "lucide-react";
import BrandPanel from "@/components/auth/BrandPanel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      <BrandPanel />

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-10">
        {/* language selector */}
        <div className="absolute right-6 top-6">
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FlagUS className="h-4 w-6 shrink-0 overflow-hidden rounded-[2px]" />
            <span>English</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)] sm:p-10">
          {children}
        </div>

        <div className="mt-8 flex items-center gap-3 text-sm text-slate-600">
          <Link href="#" className="underline-offset-2 hover:underline">
            Privacy Center
          </Link>
          <span className="text-slate-300">|</span>
          <Link href="#" className="underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          <span className="text-slate-300">|</span>
          <Link href="#" className="underline-offset-2 hover:underline">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

// Simplified US flag (stripes + canton) for the language selector.
function FlagUS({ className = "" }: { className?: string }) {
  const stripe = 20 / 13;
  return (
    <svg viewBox="0 0 28 20" className={className} aria-hidden>
      <rect width="28" height="20" fill="#b22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} y={i * stripe} width="28" height={stripe} fill="#fff" />
      ))}
      <rect width="12" height={stripe * 7} fill="#3c3b6e" />
    </svg>
  );
}
