export type ShortenUrlPayload = {
  longUrl: string;
  ttlDays?: number | null;
  customAlias?: string | null;
};

export type ShortenUrlResponse = {
  shortUrl: string;
  shortCode: string;
  longUrl: string;
  expiresAt: string | null;
};

export type AnalyticsResponse = {
  shortCode: string;
  longUrl: string;
  clickCount: number;
  createdAt: string;
  expiresAt: string | null;
  lastAccessedAt: string | null;
};

export type UrlListItem = {
  shortCode: string;
  shortUrl: string;
  longUrl: string;
  clickCount: number;
  createdAt: string;
  expiresAt: string | null;
  lastAccessedAt: string | null;
};

export type ApiError = {
  status: number;
  error: string;
  message: string;
};
