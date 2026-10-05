import { UrlForm } from "../components/UrlForm";

export function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Header */}
      <section className="text-center max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-300 mb-6 backdrop-blur-md shadow-lg shadow-indigo-500/10">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400"></span>
          Enterprise-Grade URL Infrastructure
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Supercharge your links with <span className="gradient-text">SkyLink</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          High-throughput, Redis-accelerated URL shortener engineered with Spring Boot 3 & PostgreSQL.
          Sub-millisecond redirect lookups, Base62 encoding, and async analytics.
        </p>
      </section>

      {/* Main Form Component */}
      <section>
        <UrlForm />
      </section>

      {/* Architecture & Feature Highlights */}
      <section className="grid gap-6 md:grid-cols-3 pt-6">
        <div className="glass-card glass-card-hover rounded-3xl p-6 relative overflow-hidden">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Sub-Millisecond Redis Cache</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            Hot URL lookups are served directly from in-memory Redis keys with automatic TTL expiration, bypassing database roundtrips.
          </p>
        </div>

        <div className="glass-card glass-card-hover rounded-3xl p-6 relative overflow-hidden">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Base62 Collision-Free IDs</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            Short codes are generated via Base62 bi-directional math from PostgreSQL auto-increment sequences, guaranteeing zero collisions.
          </p>
        </div>

        <div className="glass-card glass-card-hover rounded-3xl p-6 relative overflow-hidden">
          <div className="h-12 w-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Async Click Telemetry</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            Click counters and timestamps are updated non-blockingly using Spring Boot <code className="text-violet-300">@Async</code> worker threads.
          </p>
        </div>
      </section>
    </div>
  );
}
