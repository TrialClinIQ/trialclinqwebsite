import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, HelpCircle, Shield, UserPlus, LogIn, FileText, Megaphone, Layers, LifeBuoy, Briefcase, BarChart3 } from "lucide-react";
import HeaderActions from "./HeaderActions";

export default function HomeHeader() {
  const [patientsOpen, setPatientsOpen] = useState(false);
  const [sitesOpen, setSitesOpen] = useState(false);
  const [sponsorsOpen, setSponsorsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (e.target instanceof Node && !containerRef.current.contains(e.target)) {
        setPatientsOpen(false);
        setSitesOpen(false);
        setSponsorsOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
      <div ref={containerRef} className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <a href="https://trialcliniq.com/" className="flex items-center gap-2 shrink-0">
          <img
            alt="TrialCliniq"
            className="h-8 w-auto"
            src="/images/trialcliniq-logo.png"
            width="124"
            height="39"
            loading="eager"
          />
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm flex-1 min-w-0">
          <div className="relative group">
            <button
              className="hover:text-gray-600 inline-flex items-center gap-1"
              aria-haspopup="menu"
              aria-expanded={patientsOpen}
              onClick={() => { setSitesOpen(false); setPatientsOpen((v) => !v); }}
            >
              Patients and Families
              <span className={`ml-1 text-gray-400 transition-transform ${patientsOpen ? "rotate-180" : "group-hover:rotate-180"}`}>▾</span>
            </button>
            <div className={`${patientsOpen ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"} transition-opacity duration-150`}>
              <div className="absolute left-0 top-full mt-3 w-[520px]">
                <div className="rounded-2xl border bg-white p-3 shadow-xl ring-1 ring-black/5">
                  <ul className="divide-y">
                    <li>
                      <Link to="/patients/find-trial" onClick={() => setPatientsOpen(false)} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50">
                        <div className="shrink-0 rounded-lg bg-blue-50 p-2"><Search className="h-5 w-5 text-blue-700" /></div>
                        <div>
                          <div className="font-medium">Find a clinical trial</div>
                          <div className="text-gray-600 text-sm">Search active clinical trials near you by using filters and get matched instantly.</div>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link to="/patients/faq" onClick={() => setPatientsOpen(false)} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50">
                        <div className="shrink-0 rounded-lg bg-blue-50 p-2"><HelpCircle className="h-5 w-5 text-blue-700" /></div>
                        <div>
                          <div className="font-medium">Frequently Asked Questions</div>
                          <div className="text-gray-600 text-sm">Find answers to common questions and resources for navigating your clinical trial journey.</div>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link to="/patients/privacy" onClick={() => setPatientsOpen(false)} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50">
                        <div className="shrink-0 rounded-lg bg-blue-50 p-2"><Shield className="h-5 w-5 text-blue-700" /></div>
                        <div>
                          <div className="font-medium">Consent & Data Privacy</div>
                          <div className="text-gray-600 text-sm">Learn how your personal health data is securely collected, protected, and used for clinical trial matching.</div>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link to="/patients/signup-info" onClick={() => setPatientsOpen(false)} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50">
                        <div className="shrink-0 rounded-lg bg-blue-50 p-2"><UserPlus className="h-5 w-5 text-blue-700" /></div>
                        <div>
                          <div className="font-medium">Become a clinical trial volunteer</div>
                          <div className="text-gray-600 text-sm">Sign up to receive personalized clinical trial matches based on your health profile and location.</div>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link to="/patients/login" onClick={() => setPatientsOpen(false)} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50">
                        <div className="shrink-0 rounded-lg bg-blue-50 p-2"><LogIn className="h-5 w-5 text-blue-700" /></div>
                        <div>
                          <div className="font-medium">Participant Login</div>
                          <div className="text-gray-600 text-sm">Manage your trial matches and track your enrollment progress.</div>
                        </div>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="relative group">
            <button
              className="hover:text-gray-600 inline-flex items-center gap-1"
              aria-haspopup="menu"
              aria-expanded={sitesOpen}
              onClick={() => { setPatientsOpen(false); setSitesOpen((v) => !v); }}
            >
              Sites & Investigators
              <span className={`ml-1 text-gray-400 transition-transform ${sitesOpen ? "rotate-180" : "group-hover:rotate-180"}`}>▾</span>
            </button>
            <div className={`${sitesOpen ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"} transition-opacity duration-150`}>
              <div className="absolute left-0 top-full mt-3 w-[520px]">
                <div className="rounded-2xl border bg-white p-3 shadow-xl ring-1 ring-black/5">
                  <ul className="divide-y">
                    <li>
                      <Link to="/sites/blog" onClick={() => setSitesOpen(false)} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50">
                        <div className="shrink-0 rounded-lg bg-blue-50 p-2"><FileText className="h-5 w-5 text-blue-700" /></div>
                        <div>
                          <div className="font-medium">Insider Blog</div>
                          <div className="text-gray-600 text-sm">Industry trends, site management tips, and recruitment insights.</div>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link to="/sites/visibility" onClick={() => setSitesOpen(false)} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50">
                        <div className="shrink-0 rounded-lg bg-blue-50 p-2"><Megaphone className="h-5 w-5 text-blue-700" /></div>
                        <div>
                          <div className="font-medium">Visibility/ Marketing Options</div>
                          <div className="text-gray-600 text-sm">Boost your trial listings and site visibility to eligible patients.</div>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link to="/sites/multicenter" onClick={() => setSitesOpen(false)} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50">
                        <div className="shrink-0 rounded-lg bg-blue-50 p-2"><Layers className="h-5 w-5 text-blue-700" /></div>
                        <div>
                          <div className="font-medium">Multicenter Listings</div>
                          <div className="text-gray-600 text-sm">View and manage your active multicenter trial sites.</div>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link to="/support/investigators" onClick={() => setSitesOpen(false)} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50">
                        <div className="shrink-0 rounded-lg bg-blue-50 p-2"><LifeBuoy className="h-5 w-5 text-blue-700" /></div>
                        <div>
                          <div className="font-medium">TrialCliniq Support Center</div>
                          <div className="text-gray-600 text-sm">Contact support or access onboarding guides for investigators.</div>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link to="/request-access?role=site" onClick={() => setSitesOpen(false)} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50">
                        <div className="shrink-0 rounded-lg bg-blue-50 p-2"><UserPlus className="h-5 w-5 text-blue-700" /></div>
                        <div>
                          <div className="font-medium">Request Site Access</div>
                          <div className="text-gray-600 text-sm">Request access for your investigator or site admin account to get started.</div>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link to="/providers/login" onClick={() => setSitesOpen(false)} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50">
                        <div className="shrink-0 rounded-lg bg-blue-50 p-2"><LogIn className="h-5 w-5 text-blue-700" /></div>
                        <div>
                          <div className="font-medium">Provider Login</div>
                          <div className="text-gray-600 text-sm">Access your investigator or site admin dashboard.</div>
                        </div>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {/* Sponsors dropdown */}
          <div className="relative group">
            <button
              className="hover:text-gray-600 inline-flex items-center gap-1"
              aria-haspopup="menu"
              aria-expanded={sponsorsOpen}
              onClick={() => { setPatientsOpen(false); setSitesOpen(false); setSponsorsOpen((v) => !v); }}
            >
              Sponsors
              <span className={`ml-1 text-gray-400 transition-transform ${sponsorsOpen ? "rotate-180" : "group-hover:rotate-180"}`}>▾</span>
            </button>
            <div className={`${sponsorsOpen ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"} transition-opacity duration-150`}>
              <div className="absolute left-0 top-full mt-3 w-[460px]">
                <div className="rounded-2xl border bg-white p-3 shadow-xl ring-1 ring-black/5">
                  <ul className="divide-y">
                    <li>
                      <Link to="/request-access?role=sponsor" onClick={() => setSponsorsOpen(false)} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50">
                        <div className="shrink-0 rounded-lg bg-violet-50 p-2"><Briefcase className="h-5 w-5 text-violet-700" /></div>
                        <div>
                          <div className="font-medium">Request Access — Sponsor</div>
                          <div className="text-gray-600 text-sm">Pharma, biotech, and CRO teams — request access to the platform and schedule an intro call.</div>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link to="/book-demo" onClick={() => setSponsorsOpen(false)} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50">
                        <div className="shrink-0 rounded-lg bg-violet-50 p-2"><BarChart3 className="h-5 w-5 text-violet-700" /></div>
                        <div>
                          <div className="font-medium">Book a Demo</div>
                          <div className="text-gray-600 text-sm">See the recruitment dashboard and enrollment metrics in action with a live walkthrough.</div>
                        </div>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <a href="https://trialcliniq.com/contact" className="hover:text-gray-600">Contact Us</a>
          <a href="https://trialcliniq.com/about" className="hover:text-gray-600">About Us</a>
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
