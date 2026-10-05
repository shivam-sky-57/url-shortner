import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAnalytics, getErrorMessage } from "../api/urlApi";
import { CopyButton } from "../components/CopyButton";
import type { AnalyticsResponse } from "../types";

export function AnalyticsPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStats() {
    if (!shortCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAnalytics(shortCode);
      setData(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchStats();
  }, [shortCode]);

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
        <div className="glass-card rounded-3xl p-8 border-rose-500/30 bg-rose-500/10 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-rose-200">Could Not Load Analytics</h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-md mx-auto">{error}</p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 bg-slate-800 rounded animate-pulse"></div>
        <div className="glass-card rounded-3xl p-8 space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-slate-800 rounded"></div>
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-900 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const shortUrl = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/s/${data.shortCode}`;
  const isExpired = data.expiresAt ? new Date(data.expiresAt).getTime() < new Date().getTime() : false;

  // Chart dataset
  const chartData = [
    { name: "Total Clicks", clicks: data.clickCount },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>

        <button
          type="button"
          onClick={() => void fetchStats()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-all"
        >
          <svg className="h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
                /s/{data.shortCode}
              </span>
              {isExpired ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Expired
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              )}
            </div>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 break-all max-w-2xl font-mono">
              ↳ {data.longUrl}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <CopyButton value={shortUrl} label="Copy Short Link" />
            <a
              href={shortUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-400 transition-all active:scale-95"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Visit Link (+1 Click)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Clicks</p>
          <p className="mt-2 text-3xl font-extrabold text-indigo-300">{data.clickCount.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-400">All-time redirect volume</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created Date</p>
          <p className="mt-2 text-lg font-bold text-white">
            {new Date(data.createdAt).toLocaleDateString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Expiration</p>
          <p className="mt-2 text-lg font-bold text-white">
            {data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : "Never"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {data.expiresAt ? "TTL managed in Redis & DB" : "Permanent link"}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Last Accessed</p>
          <p className="mt-2 text-lg font-bold text-emerald-400">
            {data.lastAccessedAt ? new Date(data.lastAccessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "No Clicks Yet"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {data.lastAccessedAt ? new Date(data.lastAccessedAt).toLocaleDateString() : "Awaiting first redirect"}
          </p>
        </div>
      </div>

      {/* Visual Analytics and Architecture Cards */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Recharts Chart Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Click Volume Telemetry</h2>
              <p className="text-xs text-slate-400">Recorded asynchronously via Spring Boot @Async</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20">
              Live Aggregate
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
                />
                <Bar dataKey="clicks" fill="url(#colorClicks)" radius={[8, 8, 0, 0]} maxBarSize={60} />
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Technical Details Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-5">
          <h3 className="text-lg font-bold text-white">Technical Metadata</h3>
          
          <div className="space-y-3 text-xs">
            <div className="rounded-2xl bg-slate-950/60 p-3.5 border border-slate-800">
              <span className="text-slate-400 font-medium">Redis Cache Key</span>
              <p className="font-mono text-indigo-300 mt-1">url:{data.shortCode}</p>
            </div>

            <div className="rounded-2xl bg-slate-950/60 p-3.5 border border-slate-800">
              <span className="text-slate-400 font-medium">HTTP Redirect Protocol</span>
              <p className="text-slate-200 mt-1 font-semibold">HTTP 302 Found (No-Cache headers)</p>
            </div>

            <div className="rounded-2xl bg-slate-950/60 p-3.5 border border-slate-800">
              <span className="text-slate-400 font-medium">Database Persistence</span>
              <p className="text-slate-200 mt-1 font-semibold">PostgreSQL <code className="text-indigo-300">urls</code> table with index on <code className="text-indigo-300">short_code</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
