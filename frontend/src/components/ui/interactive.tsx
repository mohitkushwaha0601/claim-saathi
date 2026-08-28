"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><h2 id={titleId} className="text-xl font-bold text-ink">{title}</h2><button type="button" aria-label="Close" onClick={onClose} className="min-h-11 min-w-11 rounded-xl text-2xl text-muted hover:bg-brand-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-brand">×</button></div><div className="mt-5">{children}</div></div></div>;
}

export function Drawer({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}><div className={`absolute inset-0 bg-deep/40 transition-opacity motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} /><aside role="dialog" aria-modal="true" aria-label={title} className={`absolute top-0 right-0 h-full w-full max-w-sm overflow-y-auto bg-surface p-6 shadow-2xl transition-transform motion-reduce:transition-none ${open ? "translate-x-0" : "translate-x-full"}`}><div className="flex items-start justify-between gap-4"><h2 className="text-xl font-bold text-ink">{title}</h2><button type="button" aria-label="Close" onClick={onClose} className="min-h-11 min-w-11 rounded-xl text-2xl text-muted hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand">×</button></div><div className="mt-5">{children}</div></aside></div>;
}

export function Tabs({ tabs, value, onChange }: { tabs: Array<{ id: string; label: string; content: ReactNode }>; value?: string; onChange?: (id: string) => void }) {
  const [internalValue, setInternalValue] = useState(tabs[0]?.id ?? "");
  const activeValue = value ?? internalValue;
  const activeTab = tabs.find((tab) => tab.id === activeValue) ?? tabs[0];
  return <div><div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={tab.id === activeTab?.id} onClick={() => { setInternalValue(tab.id); onChange?.(tab.id); }} className="min-h-12 shrink-0 border-b-2 px-4 text-sm font-semibold text-muted transition aria-selected:border-brand aria-selected:text-brand focus-visible:outline-2 focus-visible:outline-brand">{tab.label}</button>)}</div>{activeTab ? <div role="tabpanel" className="pt-5">{activeTab.content}</div> : null}</div>;
}

export function Accordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return <details open={defaultOpen} className="rounded-xl border border-line bg-surface"><summary className="cursor-pointer list-none p-4 font-semibold text-ink focus-visible:outline-2 focus-visible:outline-brand">{title}</summary><div className="border-t border-line px-4 pb-4 pt-3 text-sm leading-6 text-muted">{children}</div></details>;
}
