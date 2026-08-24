import { PrimaryButton } from "./primary-button";

export function ErrorState({
  title = "Something needs attention",
  titleAsHeading = false,
  message,
  onRetry,
  retrying = false,
}: {
  title?: string;
  titleAsHeading?: boolean;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950"
    >
      {titleAsHeading ? (
        <h1 className="text-2xl font-bold tracking-[-0.025em]">{title}</h1>
      ) : (
        <p className="font-semibold">{title}</p>
      )}
      <p className="mt-1 text-sm leading-6">{message}</p>
      {onRetry ? (
        <PrimaryButton
          className="mt-4"
          type="button"
          disabled={retrying}
          onClick={onRetry}
        >
          {retrying ? "Trying again…" : "Try again"}
        </PrimaryButton>
      ) : null}
    </div>
  );
}
