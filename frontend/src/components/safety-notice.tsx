export function SafetyNotice({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      aria-label="Prototype safety information"
      className={`rounded-2xl border border-line bg-surface ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 10v6M12 7.5h.01" />
          </svg>
        </span>
        <div>
          <h2 className="font-semibold text-ink">A safe demonstration</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            This prototype uses synthetic records. No claim is submitted to EPFO.
            Government decisions are determined by reviewed rules in this
            prototype, not by AI.
          </p>
        </div>
      </div>
    </aside>
  );
}
