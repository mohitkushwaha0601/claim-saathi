"use client";

import { useTranslations } from "next-intl";

import { PageContainer } from "./page-container";

export function AppFooter() {
  const t = useTranslations("Common");
  return (
    <footer className="border-t border-line bg-surface py-8">
      <PageContainer>
        <p className="text-sm leading-6 text-muted">{t("footer")}</p>
      </PageContainer>
    </footer>
  );
}
