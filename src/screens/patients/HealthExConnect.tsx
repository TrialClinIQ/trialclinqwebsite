import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, FileText, Brain, CheckCircle2, Lock, ArrowRight, ChevronDown } from "lucide-react";
import SiteHeader from "../../components/SiteHeader";
import { useAuth } from "../../lib/auth";

const HEALTHEX_STATUS_KEY = "tc_healthex_status";

const dataTypes = [
  { icon: FileText, label: "Medical history & diagnoses" },
  { icon: FileText, label: "Current medications & dosages" },
  { icon: FileText, label: "Lab results & vitals" },
  { icon: FileText, label: "Allergies & adverse reactions" },
  { icon: FileText, label: "Prior procedures & hospitalizations" },
];

const faqs = [
  {
    q: "What is HealthEx?",
    a: "HealthEx is a HIPAA-certified health data exchange platform. It connects to your existing healthcare providers — hospitals, clinics, and labs — and retrieves your records with your explicit consent.",
  },
  {
    q: "Can I revoke access at any time?",
    a: "Yes. You can disconnect HealthEx and delete your synced data at any time from your Settings page. Revoking access stops any future data pulls.",
  },
  {
    q: "Who can see my records?",
    a: "Only TrialClinIQ's matching engine sees your normalized records — to identify which trials you may be eligible for. Research sites never receive your raw records; they only receive a pre-screening result with your consent.",
  },
  {
    q: "Is my data sold or shared for any other purpose?",
    a: "Never. Your records are used exclusively for clinical trial matching. We do not sell, license, or share your data with third parties for any other purpose.",
  },
];

export default function HealthExConnect(): JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [consentChecked, setConsentChecked] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleConnect() {
    if (!consentChecked) return;
    setIsConnecting(true);

    // Simulate HealthEx OAuth handshake (replace with real SDK call when available)
    await new Promise((r) => setTimeout(r, 1800));

    localStorage.setItem(HEALTHEX_STATUS_KEY, "connected");
    localStorage.setItem("tc_healthex_connected_at", new Date().toISOString());

    navigate("/patients/dashboard");
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteHeader />

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 ring-1 ring-blue-100 mb-5">
            <img
              src="/images/healthex-logo.png"
              alt="HealthEx"
              className="w-10 h-10 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.innerHTML =
                  '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>';
              }}
            />
          </div>
          <h1 className="text-3xl font-semibold">Connect your health records</h1>
          <p className="mt-3 text-gray-500 max-w-md mx-auto">
            TrialClinIQ partners with <strong>HealthEx</strong> to securely retrieve your medical records from your existing providers — so we can match you to trials without you filling out forms.
          </p>
        </div>

        {/* What we'll access */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">HealthEx will retrieve the following from your providers:</span>
          </div>
          <ul className="space-y-2">
            {dataTypes.map(({ label }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-gray-400">
            Data is normalized and used only for matching. It is never sold or used for advertising.
          </p>
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">How the connection works</h2>
          <ol className="space-y-4">
            {[
              { icon: Shield, text: "You consent below. Your identity is verified by HealthEx using your name and date of birth." },
              { icon: Lock, text: "HealthEx connects to your healthcare providers via FHIR APIs and retrieves your records securely." },
              { icon: Brain, text: "TrialClinIQ's AI normalizes your data and identifies trials you may be eligible for." },
              { icon: CheckCircle2, text: "Matched trials appear in your dashboard. You decide whether to let a site contact you — one trial at a time." },
            ].map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <span className="text-sm text-gray-600">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Consent + connect */}
        <div className="rounded-2xl border border-gray-200 p-6 mb-6">
          <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <span>
              I consent to TrialClinIQ and HealthEx accessing my health records for the purpose of clinical trial matching, in accordance with the{" "}
              <a href="/patients/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
              {" "}and HIPAA authorization. I understand I can revoke this at any time.
            </span>
          </label>
        </div>

        <button
          onClick={handleConnect}
          disabled={!consentChecked || isConnecting}
          className={`w-full rounded-full py-3 font-semibold text-white text-sm flex items-center justify-center gap-2 transition-colors ${
            consentChecked && !isConnecting
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-blue-300 cursor-not-allowed"
          }`}
        >
          {isConnecting ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Connecting to HealthEx…
            </>
          ) : (
            <>
              Connect with HealthEx <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <button
          onClick={() => navigate("/patients/dashboard")}
          className="w-full mt-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 text-center"
        >
          Skip for now — I'll connect later
        </button>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Frequently asked questions</h2>
          <div className="divide-y rounded-xl border border-gray-200 overflow-hidden">
            {faqs.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-left hover:bg-gray-50 transition-colors"
                >
                  {item.q}
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
