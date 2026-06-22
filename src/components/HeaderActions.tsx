import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function HeaderActions() {
  const { isAuthenticated, signOut, user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = React.useState(false);
  const [getStartedMenuOpen, setGetStartedMenuOpen] = React.useState(false);

  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (e.target instanceof Node && !menuRef.current.contains(e.target)) {
        setProfileOpen(false);
        setGetStartedMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const dashPath = user.role === "provider" ? "/providers/dashboard" : "/patients/health-profile";
    return (
      <div className="relative flex items-center gap-3" ref={menuRef}>
        <Link to={dashPath} className="px-5 py-2.5 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700">
          {user.role === "provider" ? "Dashboard" : "Health Profile"}
        </Link>
        <button
          aria-label="Profile"
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white font-medium"
          onClick={() => setProfileOpen(!profileOpen)}
          type="button"
          title={`${user.firstName} ${user.lastName}`}
        >
          {((user.firstName?.[0] || "") + (user.lastName?.[0] || "") || user.email?.[0] || "?").toUpperCase()}
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-44 rounded-lg border bg-white shadow-md z-40">
            {user.role === "patient" && (
              <Link to="/patients/settings" className="block px-3 py-2 text-sm hover:bg-gray-50">
                Settings
              </Link>
            )}
            <button
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
              onClick={async () => {
                await signOut();
                navigate("/", { replace: true });
              }}
              type="button"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-3" ref={menuRef}>
      <a
        href="https://trialcliniq.com/"
        className="px-5 py-2.5 text-sm font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        Back to Main Site
      </a>

      <button
        className="px-5 py-2.5 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => setGetStartedMenuOpen(!getStartedMenuOpen)}
        type="button"
      >
        Get Started
      </button>

      {getStartedMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border bg-white shadow-lg z-40 py-1">
          <p className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Sign up as</p>
          <button
            onClick={() => { setGetStartedMenuOpen(false); navigate("/patients/signup-info"); }}
            className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
            type="button"
          >
            Patient / Participant
          </button>
          <button
            onClick={() => { setGetStartedMenuOpen(false); navigate("/request-access?role=site"); }}
            className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
            type="button"
          >
            Researcher / Clinical Site
          </button>
          <button
            onClick={() => { setGetStartedMenuOpen(false); navigate("/request-access?role=sponsor"); }}
            className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
            type="button"
          >
            Sponsor / Pharma / CRO
          </button>
          <div className="border-t my-1" />
          <p className="px-4 pt-1 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Sign in</p>
          <button
            onClick={() => { setGetStartedMenuOpen(false); navigate("/patients/login"); }}
            className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
            type="button"
          >
            Patient login
          </button>
          <button
            onClick={() => { setGetStartedMenuOpen(false); navigate("/providers/login"); }}
            className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
            type="button"
          >
            Site login
          </button>
          <button
            onClick={() => { setGetStartedMenuOpen(false); navigate("/providers/login"); }}
            className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
            type="button"
          >
            Sponsor login
          </button>
        </div>
      )}
    </div>
  );
}
