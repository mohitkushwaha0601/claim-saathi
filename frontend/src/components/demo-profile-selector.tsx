"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { listDemoPersonas } from "@/lib/api/demo";
import type { DemoPersona } from "@/lib/api/types";

import { useAppPreferences } from "./app-providers";

export function DemoProfileSelector() {
  const t = useTranslations("Common");
  const { demoPersonaId, setDemoPersonaId } = useAppPreferences();
  const [personas, setPersonas] = useState<DemoPersona[]>([]);

  useEffect(() => {
    let active = true;
    listDemoPersonas()
      .then((response) => { if (active) setPersonas(response.personas); })
      .catch(() => { if (active) setPersonas([]); });
    return () => { active = false; };
  }, []);

  if (personas.length === 0) return null;

  return (
    <label className="flex min-h-9 items-center gap-2 text-xs font-semibold text-muted">
      <span className="sr-only">{t("demoProfile.label")}</span>
      <span aria-hidden="true">{t("demoProfile.shortLabel")}</span>
      <select
        aria-label={t("demoProfile.label")}
        value={demoPersonaId ?? ""}
        onChange={(event) => setDemoPersonaId(event.target.value || null)}
        className="min-h-9 max-w-44 rounded-lg border border-line bg-surface px-2 text-xs font-semibold text-ink focus-visible:outline-2 focus-visible:outline-brand"
      >
        <option value="">{t("demoProfile.all")}</option>
        {personas.map((persona) => (
          <option key={persona.persona_id} value={persona.persona_id}>
            {persona.display_name}
          </option>
        ))}
      </select>
    </label>
  );
}
