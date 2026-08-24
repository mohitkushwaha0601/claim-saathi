export function StatusBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-900">
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m5 10 3 3 7-7" />
      </svg>
      {children}
    </span>
  );
}
