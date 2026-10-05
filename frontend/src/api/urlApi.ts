import axios from "axios";
import type {
  AnalyticsResponse,
  ShortenUrlPayload,
  ShortenUrlResponse,
  UrlListItem,
} from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

export async function shortenUrl(payload: ShortenUrlPayload): Promise<ShortenUrlResponse> {
  const { data } = await api.post<ShortenUrlResponse>("/api/shorten", payload);
  return data;
}

export async function getAnalytics(shortCode: string): Promise<AnalyticsResponse> {
  const { data } = await api.get<AnalyticsResponse>(`/api/analytics/${shortCode}`);
  return data;
}

export async function listUrls(): Promise<UrlListItem[]> {
  const { data } = await api.get<UrlListItem[]>("/api/urls");
  return data;
}

export async function deleteUrl(shortCode: string): Promise<void> {
  await api.delete(`/api/${shortCode}`);
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
    if (error.code === "ERR_NETWORK") {
      return "Cannot reach the API. Is the backend running on port 8080?";
    }
  }
  return "Something went wrong. Please try again.";
}
