import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.lang = "en";
  document.documentElement.dataset.textScale = "100";
  document.documentElement.dataset.contrast = "standard";
  window.history.replaceState({}, "", "/");
});
