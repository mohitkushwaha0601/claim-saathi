import { API_BASE_URL } from "@/lib/config";

import type { ApiErrorEnvelope } from "./types";

export const GENERIC_API_ERROR_MESSAGE =
  "We couldn't complete that request right now.";

const inFlightReadRequests = new Map<string, Promise<unknown>>();

export class ClaimSaathiApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ClaimSaathiApiError";
    this.code = code;
    this.status = status;
  }
}

function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (!value || typeof value !== "object") return false;
  const error = (value as { error?: unknown }).error;
  if (!error || typeof error !== "object") return false;
  const detail = error as { code?: unknown; message?: unknown };
  return typeof detail.code === "string" && typeof detail.message === "string";
}

export function safeApiErrorMessage(error: unknown): string {
  return error instanceof ClaimSaathiApiError
    ? error.message
    : GENERIC_API_ERROR_MESSAGE;
}

async function executeApiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers,
    });
  } catch {
    throw new ClaimSaathiApiError(
      "NETWORK_ERROR",
      GENERIC_API_ERROR_MESSAGE,
      0,
    );
  }

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (isApiErrorEnvelope(payload)) {
      throw new ClaimSaathiApiError(
        payload.error.code,
        payload.error.message,
        response.status,
      );
    }

    throw new ClaimSaathiApiError(
      "UNEXPECTED_API_ERROR",
      GENERIC_API_ERROR_MESSAGE,
      response.status,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ClaimSaathiApiError(
      "INVALID_API_RESPONSE",
      GENERIC_API_ERROR_MESSAGE,
      response.status,
    );
  }
}

export function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const requestKey =
    method === "GET" && !init.body && !init.headers ? path : null;
  if (requestKey) {
    const existing = inFlightReadRequests.get(requestKey);
    if (existing) return existing as Promise<T>;
  }

  const request = executeApiRequest<T>(path, init);
  if (requestKey) {
    inFlightReadRequests.set(requestKey, request);
    void request.then(
      () => inFlightReadRequests.delete(requestKey),
      () => inFlightReadRequests.delete(requestKey),
    );
  }
  return request;
}
