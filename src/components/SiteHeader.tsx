import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import HeaderActions from "./HeaderActions";

type ActiveKey = "home" | "find" | "faq" | "contact" | undefined;


function NavItem({ to, label, active }: { to: string; label: string; active: boolean }) {
  if (active) {
    return <span className="text-gray-900 font-medium">{label}</span>;
  }
  return (
    <Link to={to} className="hover:text-gray-600">
      {label}
    </Link>
  );
}

export default function SiteHeader({ active }: { active?: ActiveKey }) {
  const { user } = useAuth();
  // Logo goes to dashboard for logged-in users, main site for visitors
  const logoHref = user?.role === "provider" ? "/providers/dashboard" : user ? "/patients/dashboard" : "https://trialcliniq.com/";
  const logoIsExternal = !user;

  return (
    <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {logoIsExternal ? (
          <a href={logoHref} className="flex items-center gap-2">
            <img alt="TrialCliniq" className="h-8 w-auto" src="/images/trialcliniq-logo.png" width="124" height="39" loading="eager" />
          </a>
        ) : (
          <Link to={logoHref} className="flex items-center gap-2">
            <img alt="TrialCliniq" className="h-8 w-auto" src="/images/trialcliniq-logo.png" width="124" height="39" loading="eager" />
          </Link>
        )}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="https://trialcliniq.com/" className="hover:text-gray-600">Main Site</a>
          <NavItem to="/patients/find-trial" label="Find a Trial" active={active === "find"} />
          <NavItem to="/patients/faq" label="FAQ" active={active === "faq"} />
          <a href="https://trialcliniq.com/contact" className="hover:text-gray-600">Contact</a>
        </nav>
        <HeaderActions />
      </div>
    </header>
  );
}
