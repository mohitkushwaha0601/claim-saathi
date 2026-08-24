import type { ReactElement, ReactNode } from "react";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";

import { AppProviders } from "@/components/app-providers";

function TestProviders({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult {
  return render(ui, { wrapper: TestProviders, ...options });
}
