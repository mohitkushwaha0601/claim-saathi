import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

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
