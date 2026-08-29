import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, String(value));
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  clear: () => {
    storage.clear();
  },
  key: (index: number) => Array.from(storage.keys())[index] ?? null,
  get length() {
    return storage.size;
  },
};

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
  storage.clear();
  document.documentElement.lang = "en";
  document.documentElement.dataset.textScale = "100";
  document.documentElement.dataset.contrast = "standard";
  document.documentElement.dataset.theme = "light";
  window.history.replaceState({}, "", "/");
});
