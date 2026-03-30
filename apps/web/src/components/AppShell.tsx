import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { DashboardPage } from "../pages/DashboardPage";
import { NewJournalPage } from "../pages/NewJournalPage";
import { OnboardingPage } from "../pages/OnboardingPage";
import { SettingsPage } from "../pages/SettingsPage";
import { TripDetailPage } from "../pages/TripDetailPage";
import { TripsPage } from "../pages/TripsPage";

type AppShellProps = {
  userEmail: string;
  onLogout: () => void;
  onResetOnboarding: () => void;
  initialRoute: string;
};

const navItems = [
  { label: "Home", to: "/" },
  { label: "Trips", to: "/trips" },
  { label: "New Journal", to: "/journal/new" },
];

export function AppShell({ userEmail, onLogout, onResetOnboarding, initialRoute }: AppShellProps) {
  const navigate = useNavigate();
  const hasRouted = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (hasRouted.current) {
      return;
    }

    hasRouted.current = true;

    if (initialRoute && initialRoute !== "/") {
      navigate(initialRoute, { replace: true });
    }
  }, [navigate, initialRoute]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current) {
        return;
      }

      if (event.target instanceof Node && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="top-bar card fade-up">
        <div className="brand-block">
          <Link to="/" className="brand-link">
            AdvenSure
          </Link>
          <span className="muted">Wander slowly. Remember deeply.</span>
        </div>

        <div className="top-bar-actions" ref={menuRef}>
          <button
            type="button"
            className="pill email-trigger"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="account-menu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {userEmail}
          </button>

          {menuOpen ? (
            <div id="account-menu" role="menu" className="account-menu card">
              <Link
                role="menuitem"
                to="/settings"
                className="menu-item"
                onClick={() => setMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                role="menuitem"
                type="button"
                className="menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <nav className="desktop-nav card fade-up">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="shell-main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/:tripId" element={<TripDetailPage />} />
          <Route path="/journal/new" element={<NewJournalPage />} />
          <Route
            path="/settings"
            element={<SettingsPage onResetOnboarding={onResetOnboarding} />}
          />
          <Route
            path="/onboarding"
            element={<OnboardingPage onComplete={(nextPath) => navigate(nextPath, { replace: true })} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="mobile-nav">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "") }>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
