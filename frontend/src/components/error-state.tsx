import { PrimaryButton } from "./primary-button";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950"
    >
      <p className="font-semibold">Something needs attention</p>
      <p className="mt-1 text-sm leading-6">{message}</p>
      {onRetry ? (
        <PrimaryButton className="mt-4" type="button" onClick={onRetry}>
          Try again
        </PrimaryButton>
      ) : null}
    </div>
  );
}
