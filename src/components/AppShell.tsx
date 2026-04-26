import { ClipboardList, House, Siren, TrendingUp, FileText } from "lucide-react";
import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Live Monitoring", icon: House },
  { to: "/history", label: "Inspections History", icon: ClipboardList },
  { to: "/trends", label: "Safety Trends", icon: TrendingUp },
  { to: "/alerts", label: "Alerts & Actions", icon: Siren },
  { to: "/reports", label: "Reports", icon: FileText },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--surface-bg)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-amber-600">Site Safety Dashboard</p>
            <h1 className="text-xl font-bold">Construction Safety Monitor</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 sm:block">
              Safety First
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-700 md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
        <nav className="mx-auto hidden max-w-7xl gap-2 overflow-auto px-4 pb-3 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap ${
                    isActive
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`
                }
              >
                <Icon className="size-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        {mobileNavOpen ? (
          <nav className="mx-auto grid max-w-7xl gap-2 px-4 pb-3 md:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`
                  }
                >
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        ) : null}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
