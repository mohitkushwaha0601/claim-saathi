import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { useTranslations } from "next-intl";

const buttonVariants = {
  primary:
    "bg-brand text-white shadow-sm hover:bg-brand-strong disabled:bg-slate-400",
  secondary:
    "border border-line-strong bg-surface text-ink hover:border-brand hover:text-brand disabled:bg-slate-100",
  ghost:
    "text-brand hover:bg-brand-soft disabled:text-slate-400",
  danger:
    "bg-rust text-white shadow-sm hover:bg-red-900 disabled:bg-slate-400",
} as const;

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
}) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-70 ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line bg-surface text-ink transition hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-12 w-full rounded-xl border border-line-strong bg-surface px-4 text-base text-ink outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:bg-slate-100 ${className}`}
      {...props}
    />
  );
}

export function SearchInput({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="sr-only">{label}</span>
      <span className="relative block">
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="6" />
            <path d="m16 16 4 4" />
          </svg>
        </span>
        <Input {...props} aria-label={label} className="pl-12" />
      </span>
    </label>
  );
}

export function Card({
  as: Element = "div",
  className = "",
  children,
}: {
  as?: "div" | "article" | "section";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Element className={`rounded-2xl border border-line bg-surface p-5 sm:p-6 ${className}`}>
      {children}
    </Element>
  );
}

export function ServiceCard({
  title,
  description,
  href,
  category,
  className = "",
}: {
  title: string;
  description: string;
  href: string;
  category?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`group block rounded-2xl border border-line bg-surface p-5 transition hover:border-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
    >
      {category ? <p className="text-xs font-bold tracking-[0.12em] text-brand uppercase">{category}</p> : null}
      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
        <span aria-hidden="true" className="text-lg text-brand transition group-hover:translate-x-0.5">→</span>
      </div>
    </a>
  );
}

export function RoleCard({
  title,
  description,
  onClick,
  className = "",
}: {
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
}) {
  const content = (
    <>
      <h3 className="font-bold text-ink">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
    </>
  );
  if (!onClick) return <Card className={className}>{content}</Card>;
  return (
    <button type="button" onClick={onClick} className={`block w-full text-left transition hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}>
      <Card>{content}</Card>
    </button>
  );
}

export type StatusTone = "success" | "warning" | "danger" | "neutral" | "info";

const statusTones: Record<StatusTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  danger: "border-rose-200 bg-rose-50 text-rose-950",
  neutral: "border-line bg-slate-50 text-slate-800",
  info: "border-sky-200 bg-sky-50 text-sky-900",
};

export function StatusBadge({
  children,
  tone = "success",
  className = "",
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return <span className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-sm font-semibold ${statusTones[tone]} ${className}`}><span aria-hidden="true">{tone === "success" ? "✓" : "•"}</span>{children}</span>;
}

export function StatusTimeline({
  items,
  currentIndex = -1,
}: {
  items: Array<{ label: string; detail?: string }>;
  currentIndex?: number;
}) {
  return (
    <ol className="grid gap-4 sm:grid-cols-4">
      {items.map((item, index) => {
        const complete = currentIndex >= index;
        return (
          <li key={item.label} className="relative flex gap-3 sm:block">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${complete ? "border-brand bg-brand text-white" : "border-line-strong bg-surface text-muted"}`}>
              {complete ? "✓" : index + 1}
            </span>
            <span className="sm:mt-3 sm:block">
              <span className="block font-semibold text-ink">{item.label}</span>
              {item.detail ? <span className="mt-1 block text-sm text-muted">{item.detail}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function StepIndicator({ current, total, label }: { current: number; total: number; label?: string }) {
  const t = useTranslations("Common");
  const stepLabel = label ?? t("stepOf", { current, total });
  return (
    <div aria-label={stepLabel} className="flex items-center gap-3">
      <span className="text-sm font-semibold text-ink">{stepLabel}</span>
      <ProgressBar value={(current / total) * 100} className="flex-1" />
    </div>
  );
}

export function Alert({ title, children, tone = "info" }: { title?: string; children: ReactNode; tone?: StatusTone }) {
  return <div role="alert" className={`rounded-xl border p-4 ${statusTones[tone]}`}>{title ? <h2 className="font-bold">{title}</h2> : null}<div className={title ? "mt-1 text-sm leading-6" : "text-sm leading-6"}>{children}</div></div>;
}

export function Notice({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <aside className={`rounded-xl border border-brand/25 bg-brand-soft p-4 text-sm leading-6 text-ink ${className}`}>{children}</aside>;
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue} className={`h-2 overflow-hidden rounded-full bg-line ${className}`}><span className="block h-full rounded-full bg-brand transition-[width] motion-reduce:transition-none" style={{ width: `${safeValue}%` }} /></div>;
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center"><h2 className="text-lg font-bold text-ink">{title}</h2>{children ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{children}</p> : null}{action ? <div className="mt-5">{action}</div> : null}</div>;
}

export function Skeleton({ className = "", label }: { className?: string; label?: string }) {
  const t = useTranslations("Common");
  return <div role="status" aria-label={label ?? t("loading")} className={`animate-pulse rounded-xl bg-line motion-reduce:animate-none ${className}`} />;
}

export function PrototypeBoundary({ children, className = "" }: { children: ReactNode; className?: string }) {
  const t = useTranslations("Common");
  return <aside className={`prototype-surface rounded-xl border border-gold/60 p-4 text-sm leading-6 text-ink ${className}`}><p className="font-bold">{t("prototypeBoundary")}</p><div className="mt-1">{children}</div></aside>;
}

export function AccessibilityControls({ children, className = "" }: { children: ReactNode; className?: string }) {
  const t = useTranslations("Common");
  return <section aria-label={t("accessibilityControls")} className={className}>{children}</section>;
}
