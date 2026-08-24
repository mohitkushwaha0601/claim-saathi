export function LoadingState({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-36 items-center justify-center gap-3 rounded-2xl border border-line bg-surface p-6 text-muted"
    >
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span className="font-medium">{message}</span>
    </div>
  );
}
