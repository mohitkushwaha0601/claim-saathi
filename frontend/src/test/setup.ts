import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

try {
  if (typeof window.localStorage?.setItem !== "function") {
    const values = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
  }
} catch {
  // Tests that do not use browser storage remain runnable in restricted jsdom environments.
}

afterEach(() => {
  cleanup();
  try {
    window.localStorage.clear();
  } catch {
    // Some Node/jsdom combinations expose a partial localStorage shim.
  }
  document.documentElement.lang = "en";
  document.documentElement.dataset.textScale = "100";
  document.documentElement.dataset.contrast = "standard";
  window.history.replaceState({}, "", "/");
});
