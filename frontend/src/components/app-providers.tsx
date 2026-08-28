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

const STORAGE_KEYS = {
  locale: "claimsaathi.locale",
  textScale: "claimsaathi.textScale",
  highContrast: "claimsaathi.highContrast",
  journeyMode: "claimsaathi.journeyMode",
  reducedMotion: "claimsaathi.reducedMotion",
  readableSpacing: "claimsaathi.readableSpacing",
  demoPersona: "claimsaathi.demoPersona",
  theme: "claimsaathi.theme",
} as const;

export type JourneyMode = "quick" | "guided";
export type ThemeMode = "system" | "light" | "dark";

interface PreferencesContextValue {
  locale: AppLocale;
  textScale: TextScale;
  highContrast: boolean;
  journeyMode: JourneyMode;
  reducedMotion: boolean;
  readableSpacing: boolean;
  demoPersonaId: string | null;
  online: boolean;
  saveData: boolean;
  theme: ThemeMode;
  setLocale: (locale: AppLocale) => void;
  decreaseTextScale: () => void;
  resetTextScale: () => void;
  increaseTextScale: () => void;
  toggleHighContrast: () => void;
  setJourneyMode: (mode: JourneyMode) => void;
  toggleReducedMotion: () => void;
  toggleReadableSpacing: () => void;
  setDemoPersonaId: (personaId: string | null) => void;
  setTheme: (theme: ThemeMode) => void;
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

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
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
  const [journeyMode, updateJourneyMode] = useState<JourneyMode>("guided");
  const [reducedMotion, updateReducedMotion] = useState(false);
  const [readableSpacing, updateReadableSpacing] = useState(false);
  const [demoPersonaId, updateDemoPersonaId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [saveData, setSaveData] = useState(false);
  const [theme, updateTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    let active = true;
    const storedLocale = readStoredPreference(STORAGE_KEYS.locale);
    const storedTextScale = Number(
      readStoredPreference(STORAGE_KEYS.textScale),
    );
    const storedContrast = readStoredPreference(STORAGE_KEYS.highContrast);
    const storedJourneyMode = readStoredPreference(STORAGE_KEYS.journeyMode);
    const storedReducedMotion = readStoredPreference(STORAGE_KEYS.reducedMotion);
    const storedReadableSpacing = readStoredPreference(STORAGE_KEYS.readableSpacing);
    const storedDemoPersona = readStoredPreference(STORAGE_KEYS.demoPersona);
    const storedTheme = readStoredPreference(STORAGE_KEYS.theme);

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
      if (storedJourneyMode === "quick" || storedJourneyMode === "guided") updateJourneyMode(storedJourneyMode);
      if (storedReducedMotion === "true") updateReducedMotion(true);
      if (storedReadableSpacing === "true") updateReadableSpacing(true);
      if (storedDemoPersona) updateDemoPersonaId(storedDemoPersona);
      if (isThemeMode(storedTheme)) updateTheme(storedTheme);
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
    root.dataset.motion = reducedMotion ? "reduced" : "standard";
    root.dataset.spacing = readableSpacing ? "readable" : "standard";
    root.dataset.theme = theme;
  }, [highContrast, locale, readableSpacing, reducedMotion, textScale, theme]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      locale,
      textScale,
      highContrast,
      journeyMode,
      reducedMotion,
      readableSpacing,
      demoPersonaId,
      online,
      saveData,
      theme,
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
      setJourneyMode(nextMode) {
        updateJourneyMode(nextMode);
        setStoredPreference(STORAGE_KEYS.journeyMode, nextMode);
      },
      toggleReducedMotion() {
        updateReducedMotion((current) => {
          const next = !current;
          setStoredPreference(STORAGE_KEYS.reducedMotion, String(next));
          return next;
        });
      },
      toggleReadableSpacing() {
        updateReadableSpacing((current) => {
          const next = !current;
          setStoredPreference(STORAGE_KEYS.readableSpacing, String(next));
          return next;
        });
      },
      setDemoPersonaId(nextPersonaId) {
        updateDemoPersonaId(nextPersonaId);
        if (nextPersonaId) setStoredPreference(STORAGE_KEYS.demoPersona, nextPersonaId);
        else {
          try { window.localStorage.removeItem(STORAGE_KEYS.demoPersona); } catch { /* optional preference */ }
        }
      },
      setTheme(nextTheme) {
        updateTheme(nextTheme);
        setStoredPreference(STORAGE_KEYS.theme, nextTheme);
      },
    }),
    [demoPersonaId, highContrast, journeyMode, locale, online, readableSpacing, reducedMotion, saveData, textScale, theme],
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
