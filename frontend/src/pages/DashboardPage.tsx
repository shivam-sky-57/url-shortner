import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteUrl, getErrorMessage, listUrls } from "../api/urlApi";
import { CopyButton } from "../components/CopyButton";
import type { UrlListItem } from "../types";

export function DashboardPage() {
  const [urls, setUrls] = useState<UrlListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("all");
  const [sortBy, setSortBy] = useState<"newest" | "clicks" | "oldest">("newest");
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listUrls();
      setUrls(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(shortCode: string) {
    if (!window.confirm(`Are you sure you want to delete short URL "${shortCode}"?`)) {
      return;
    }
    setDeletingCode(shortCode);
    try {
      await deleteUrl(shortCode);
      setUrls((current) => current.filter((item) => item.shortCode !== shortCode));
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setDeletingCode(null);
    }
  }

  // Summary Metrics
  const stats = useMemo(() => {
    const now = new Date().getTime();
    let totalClicks = 0;
    let activeCount = 0;
    let expiredCount = 0;

    urls.forEach((item) => {
      totalClicks += item.clickCount;
      const isExpired = item.expiresAt ? new Date(item.expiresAt).getTime() < now : false;
      if (isExpired) {
        expiredCount++;
      } else {
        activeCount++;
      }
    });

    return {
      totalLinks: urls.length,
      totalClicks,
      activeCount,
      expiredCount,
    };
  }, [urls]);

  // Filtered and Sorted URLs
  const filteredUrls = useMemo(() => {
    const now = new Date().getTime();
    const query = searchQuery.toLowerCase().trim();

    return urls
      .filter((item) => {
        const isExpired = item.expiresAt ? new Date(item.expiresAt).getTime() < now : false;
        if (filterStatus === "active" && isExpired) return false;
        if (filterStatus === "expired" && !isExpired) return false;

        if (!query) return true;
        return (
          item.shortCode.toLowerCase().includes(query) ||
          item.longUrl.toLowerCase().includes(query) ||
          item.shortUrl.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortBy === "clicks") {
          return b.clickCount - a.clickCount;
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [urls, searchQuery, filterStatus, sortBy]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Link Dashboard</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
              {urls.length} Total
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time management and click telemetry for all your shortened links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
          >
            <svg
              className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-400" : "text-slate-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-400 transition-all active:scale-95"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New Link</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Short Links</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{stats.totalLinks}</p>
          <p className="mt-1 text-xs text-indigo-400">Stored in PostgreSQL</p>
        </div>
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Clicks</p>
          <p className="mt-2 text-3xl font-extrabold text-indigo-300">{stats.totalClicks.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-400">Tracked asynchronously</p>
        </div>
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Links</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-400">{stats.activeCount}</p>
          <p className="mt-1 text-xs text-emerald-500/80">Cached in Redis</p>
        </div>
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Expired Links</p>
          <p className="mt-2 text-3xl font-extrabold text-rose-400">{stats.expiredCount}</p>
          <p className="mt-1 text-xs text-slate-400">Past specified TTL</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code or destination..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills & Sort */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center rounded-xl bg-slate-950/60 p-1 border border-slate-800">
            {(["all", "active", "expired"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all ${
                  filterStatus === status
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="clicks">Most Clicks</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200 flex items-start gap-3">
          <svg className="h-5 w-5 text-rose-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold text-rose-300">Failed to load URLs</p>
            <p className="mt-1 text-slate-300">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5 animate-pulse flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-28 bg-slate-800 rounded"></div>
                <div className="h-3 w-72 bg-slate-800/60 rounded"></div>
              </div>
              <div className="h-8 w-24 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredUrls.length === 0 && !error && (
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-3xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 mb-4">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">
            {searchQuery || filterStatus !== "all" ? "No matching links found" : "No short links created yet"}
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your search criteria or resetting filters."
              : "Get started by shortening your first long URL from the home page."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {searchQuery || filterStatus !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Reset Filters
              </button>
            ) : (
              <Link
                to="/"
                className="rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400"
              >
                Shorten a URL
              </Link>
            )}
          </div>
        </div>
      )}

      {/* URL Cards List */}
      {!loading && filteredUrls.length > 0 && (
        <div className="grid gap-4">
          {filteredUrls.map((item) => {
            const isExpired = item.expiresAt ? new Date(item.expiresAt).getTime() < new Date().getTime() : false;

            return (
              <article
                key={item.shortCode}
                className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-all"
              >
                {/* Left content */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-base font-bold text-indigo-300">
                      /s/{item.shortCode}
                    </span>
                    {isExpired ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                      <svg className="h-3 w-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {item.clickCount} clicks
                    </span>
                  </div>

                  <p className="truncate text-xs text-slate-400 font-mono" title={item.longUrl}>
                    ↳ {item.longUrl}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                    <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>
                      {item.expiresAt
                        ? `Expires: ${new Date(item.expiresAt).toLocaleDateString()}`
                        : "Never expires"}
                    </span>
                    {item.lastAccessedAt && (
                      <>
                        <span>•</span>
                        <span>Last accessed: {new Date(item.lastAccessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <CopyButton value={item.shortUrl} label="Copy Link" />
                  
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white transition-all"
                    title="Open short link"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>Visit</span>
                  </a>

                  <Link
                    to={`/analytics/${item.shortCode}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500 hover:text-white transition-all"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Analytics</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => void handleDelete(item.shortCode)}
                    disabled={deletingCode === item.shortCode}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all disabled:opacity-50"
                    title="Delete short link"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>{deletingCode === item.shortCode ? "..." : "Delete"}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
