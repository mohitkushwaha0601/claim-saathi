"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NextIntlClientProvider } from "next-intl";

import englishMessages from "../../messages/en.json";
import { isAppLocale, type AppLocale } from "@/i18n/config";

export const TEXT_SCALES = [100, 125, 150, 175, 200] as const;
export type TextScale = (typeof TEXT_SCALES)[number];
export type ColorTheme = "light" | "dark";

const STORAGE_KEYS = {
  locale: "claimsaathi.locale",
  textScale: "claimsaathi.textScale",
  highContrast: "claimsaathi.highContrast",
  colorTheme: "claimsaathi.colorTheme",
} as const;

interface PreferencesContextValue {
  locale: AppLocale;
  textScale: TextScale;
  highContrast: boolean;
  colorTheme: ColorTheme;
  online: boolean;
  saveData: boolean;
  setLocale: (locale: AppLocale) => void;
  decreaseTextScale: () => void;
  resetTextScale: () => void;
  increaseTextScale: () => void;
  toggleHighContrast: () => void;
  toggleColorTheme: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);
type AppMessages = typeof englishMessages;

async function loadHindiMessages(): Promise<AppMessages> {
  const catalogueModule = await import("../../messages/hi.json");
  return catalogueModule.default as AppMessages;
}

function isTextScale(value: unknown): value is TextScale {
  return (
    typeof value === "number" &&
    TEXT_SCALES.includes(value as TextScale)
  );
}

function isColorTheme(value: unknown): value is ColorTheme {
  return value === "light" || value === "dark";
}

function setStoredPreference(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage is an optional enhancement. The in-memory preference still works.
  }
}

function readStoredPreference(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readSaveDataPreference(): boolean {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return connection?.saveData === true;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<AppLocale>("en");
  const [messages, setMessages] = useState<AppMessages>(englishMessages);
  const [textScale, updateTextScale] = useState<TextScale>(100);
  const [highContrast, updateHighContrast] = useState(false);
  const [colorTheme, updateColorTheme] = useState<ColorTheme>("light");
  const [online, setOnline] = useState(true);
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    let active = true;
    const storedLocale = readStoredPreference(STORAGE_KEYS.locale);
    const storedTextScale = Number(
      readStoredPreference(STORAGE_KEYS.textScale),
    );
    const storedContrast = readStoredPreference(STORAGE_KEYS.highContrast);
    const storedColorTheme = readStoredPreference(STORAGE_KEYS.colorTheme);

    const updateNetworkStatus = () => setOnline(navigator.onLine);
    const updateSaveData = () => setSaveData(readSaveDataPreference());
    const connection = (
      navigator as Navigator & {
        connection?: {
          addEventListener?: (type: string, listener: () => void) => void;
          removeEventListener?: (type: string, listener: () => void) => void;
        };
      }
    ).connection;

    queueMicrotask(() => {
      if (!active) return;
      if (storedLocale === "hi") {
        void loadHindiMessages().then((loadedMessages) => {
          if (!active) return;
          setMessages(loadedMessages);
          updateLocale("hi");
        });
      } else if (isAppLocale(storedLocale)) {
        updateLocale(storedLocale);
      }
      if (isTextScale(storedTextScale)) updateTextScale(storedTextScale);
      if (storedContrast === "true") updateHighContrast(true);
      if (isColorTheme(storedColorTheme)) updateColorTheme(storedColorTheme);
      updateNetworkStatus();
      updateSaveData();
    });
    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);
    connection?.addEventListener?.("change", updateSaveData);
    return () => {
      active = false;
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
      connection?.removeEventListener?.("change", updateSaveData);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dataset.textScale = String(textScale);
    root.dataset.contrast = highContrast ? "high" : "standard";
    root.dataset.theme = colorTheme;
  }, [colorTheme, highContrast, locale, textScale]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      locale,
      textScale,
      highContrast,
      colorTheme,
      online,
      saveData,
      setLocale(nextLocale) {
        if (nextLocale === "en") {
          setMessages(englishMessages);
          updateLocale("en");
          setStoredPreference(STORAGE_KEYS.locale, "en");
          return;
        }
        void loadHindiMessages().then((loadedMessages) => {
          setMessages(loadedMessages);
          updateLocale("hi");
          setStoredPreference(STORAGE_KEYS.locale, "hi");
        });
      },
      decreaseTextScale() {
        updateTextScale((current) => {
          const index = TEXT_SCALES.indexOf(current);
          const next = TEXT_SCALES[Math.max(0, index - 1)];
          setStoredPreference(STORAGE_KEYS.textScale, String(next));
          return next;
        });
      },
      resetTextScale() {
        updateTextScale(100);
        setStoredPreference(STORAGE_KEYS.textScale, "100");
      },
      increaseTextScale() {
        updateTextScale((current) => {
          const index = TEXT_SCALES.indexOf(current);
          const next = TEXT_SCALES[Math.min(TEXT_SCALES.length - 1, index + 1)];
          setStoredPreference(STORAGE_KEYS.textScale, String(next));
          return next;
        });
      },
      toggleHighContrast() {
        updateHighContrast((current) => {
          const next = !current;
          setStoredPreference(STORAGE_KEYS.highContrast, String(next));
          return next;
        });
      },
      toggleColorTheme() {
        updateColorTheme((current) => {
          const next = current === "light" ? "dark" : "light";
          setStoredPreference(STORAGE_KEYS.colorTheme, next);
          return next;
        });
      },
    }),
    [colorTheme, highContrast, locale, online, saveData, textScale],
  );

  return (
    <PreferencesContext.Provider value={value}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="Asia/Kolkata"
      >
        {children}
      </NextIntlClientProvider>
    </PreferencesContext.Provider>
  );
}

export function useAppPreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("useAppPreferences must be used inside AppProviders.");
  }
  return context;
}
