import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import QRCode from "react-qr-code";
import { Link } from "react-router-dom";
import { z } from "zod";
import { getErrorMessage, shortenUrl } from "../api/urlApi";
import type { ShortenUrlResponse } from "../types";
import { CopyButton } from "./CopyButton";

const schema = z.object({
  longUrl: z
    .string()
    .min(1, "URL is required")
    .regex(/^https?:\/\/.+/i, "Enter a valid URL starting with http:// or https://"),
  ttlDays: z
    .string()
    .optional()
    .refine((value) => !value || (Number(value) >= 1 && Number(value) <= 3650), "TTL must be between 1 and 3650 days"),
  customAlias: z
    .string()
    .optional()
    .refine((value) => !value || /^[A-Za-z0-9_-]{3,10}$/.test(value), "Alias must be 3-10 characters (letters, numbers, _ or -)"),
});

type FormValues = z.infer<typeof schema>;

export function UrlForm() {
  const [result, setResult] = useState<ShortenUrlResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      longUrl: "",
      ttlDays: "",
      customAlias: "",
    },
  });


  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      const payload = {
        longUrl: values.longUrl.trim(),
        ttlDays: values.ttlDays ? Number(values.ttlDays) : null,
        customAlias: values.customAlias?.trim() || null,
      };
      const response = await shortenUrl(payload);
      setResult(response);
      reset({ longUrl: "", ttlDays: "", customAlias: "" });
    } catch (err) {
      setResult(null);
      setError(getErrorMessage(err));
    }
  }

  function downloadQrCode() {
    if (!qrContainerRef.current) return;
    const svg = qrContainerRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 20, 20, 360, 360);
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `qr-${result?.shortCode || "link"}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] items-start">
      {/* Input Form Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Shorten a URL</span>
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Generate a fast, Redis-cached Base62 short link in milliseconds.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            HTTP 302 Redirect
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          {/* Main URL input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Destination URL <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input
                {...register("longUrl")}
                type="url"
                placeholder="https://example.com/your-very-long-link-path-here"
                className={`w-full rounded-2xl border bg-slate-950/80 py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-600 transition-all ${
                  errors.longUrl
                    ? "border-rose-500/80 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                }`}
              />
            </div>
            {errors.longUrl && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.longUrl.message}
              </p>
            )}
          </div>

          {/* Toggle Advanced Options */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <svg
                className={`h-3.5 w-3.5 transform transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>{showAdvanced ? "Hide Advanced Options" : "Show Advanced Options (TTL & Custom Alias)"}</span>
            </button>
          </div>

          {/* Advanced fields */}
          {showAdvanced && (
            <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Custom Alias (Optional)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-xs">
                    /s/
                  </div>
                  <input
                    {...register("customAlias")}
                    type="text"
                    placeholder="my-alias"
                    maxLength={10}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/90 py-2.5 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                {errors.customAlias && (
                  <p className="mt-1 text-xs text-rose-400">{errors.customAlias.message}</p>
                )}
                <p className="mt-1 text-[11px] text-slate-500">3-10 chars: letters, digits, _ or -</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Expiry / TTL (Days)
                </label>
                <div className="relative">
                  <input
                    {...register("ttlDays")}
                    type="number"
                    min={1}
                    max={3650}
                    placeholder="e.g. 7 (Never expires if empty)"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/90 py-2.5 px-3 text-xs text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                {errors.ttlDays && (
                  <p className="mt-1 text-xs text-rose-400">{errors.ttlDays.message}</p>
                )}
                <p className="mt-1 text-[11px] text-slate-500">Auto-expires in Redis & DB</p>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-200 flex items-start gap-3">
              <svg className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-rose-300">Shortening Failed</p>
                <p className="mt-0.5 text-slate-300">{error}</p>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 py-3.5 font-semibold text-white shadow-xl shadow-indigo-600/30 hover:from-indigo-400 hover:to-indigo-600 transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Generating Short Link...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Shorten URL</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Result Card / Empty State */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 relative overflow-hidden flex flex-col justify-between min-h-[420px]">
        {result ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Ready to Share
              </span>
              <Link
                to={`/analytics/${result.shortCode}`}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                <span>View Analytics</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Short URL Box */}
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-4">
              <p className="text-xs font-medium text-indigo-300 uppercase tracking-wider">Short Link</p>
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block break-all text-lg sm:text-xl font-bold text-white hover:text-indigo-300 transition-colors"
              >
                {result.shortUrl}
              </a>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <CopyButton value={result.shortUrl} label="Copy Link" />
                <a
                  href={result.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white transition-all"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Test Redirect</span>
                </a>
              </div>
            </div>

            {/* Meta details */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Short Code</span>
                <span className="font-mono font-semibold text-slate-200">{result.shortCode}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Original Destination</span>
                <span className="max-w-[200px] truncate text-slate-300" title={result.longUrl}>
                  {result.longUrl}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Status / Expiry</span>
                <span className="text-slate-300">
                  {result.expiresAt ? `Expires ${new Date(result.expiresAt).toLocaleDateString()}` : "Never (Permanent)"}
                </span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex items-center gap-5 pt-2">
              <div ref={qrContainerRef} className="rounded-2xl bg-white p-3 shadow-xl shrink-0">
                <QRCode value={result.shortUrl} size={110} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">QR Code</p>
                <p className="text-xs text-slate-400 mt-0.5">Scan to redirect instantly from any smartphone camera.</p>
                <button
                  type="button"
                  onClick={downloadQrCode}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-indigo-400 hover:text-white transition-all"
                >
                  <svg className="h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download PNG</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 h-full">
            <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-200">Your Short URL Generator</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-xs">
              Paste a URL on the left to generate your custom Base62 short link, QR code, and real-time analytics.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] text-slate-500">
              <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800">⚡ Redis Cache-Aside</span>
              <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800">🔒 Base62 Unique IDs</span>
              <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800">📊 Async Telemetry</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
