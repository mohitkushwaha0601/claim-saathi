const LOCAL_API_BASE_URL = "http://localhost:8000";

export function normalizeApiBaseUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL must be a valid absolute HTTP(S) URL.",
    );
  }

  if (!(["http:", "https:"] as string[]).includes(url.protocol)) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL must use the http or https protocol.",
    );
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL must not contain credentials, query parameters, or a fragment.",
    );
  }

  return url.toString().replace(/\/$/, "");
}

export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? LOCAL_API_BASE_URL,
);
