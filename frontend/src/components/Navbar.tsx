import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
    isActive
      ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 font-semibold"
      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
  }`;

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <NavLink to="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950/40 backdrop-blur-sm text-white font-bold text-lg">
              ⚡
            </div>
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              SkyLink
            </span>
            <span className="hidden sm:inline-block ml-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">
              v3.3 • Redis Cache
            </span>
          </div>
        </NavLink>

        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-1 backdrop-blur-md">
            <NavLink to="/" className={linkClass} end>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Shorten</span>
            </NavLink>
            <NavLink to="/dashboard" className={linkClass}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Dashboard</span>
            </NavLink>
          </nav>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-400">PostgreSQL + Redis Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
}
