// Decorative right-edge rail (Quick Learn / Feedback) from the Walmart layout.
export default function SideRailTabs() {
  return (
    <div className="fixed right-0 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 xl:flex">
      <button
        type="button"
        className="rounded-l-lg bg-wm-navy px-2 py-4 text-xs font-semibold tracking-wide text-white shadow-md transition-colors hover:bg-wm-blue-dark"
        style={{ writingMode: "vertical-rl" }}
      >
        Quick Learn
      </button>
      <button
        type="button"
        className="rounded-l-lg bg-slate-900 px-2 py-4 text-xs font-semibold tracking-wide text-white shadow-md transition-colors hover:bg-slate-700"
        style={{ writingMode: "vertical-rl" }}
      >
        Feedback
      </button>
    </div>
  );
}
