import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Building2, Briefcase, CheckCircle2 } from "lucide-react";
import HomeHeader from "../components/HomeHeader";
import { getCsrfToken } from "../lib/csrf";

const SITE_ORG_TYPES = [
  "Hospital",
  "Academic Medical Center",
  "Private Practice",
  "Community Health Center",
  "CRO",
  "Other",
];

const SPONSOR_ORG_TYPES = [
  "Pharmaceutical Company",
  "Biotech",
  "CRO",
  "Medical Device",
  "Other",
];

const TRIAL_COUNT_OPTIONS = ["1-5", "6-20", "21-50", "50+"];

export default function RequestAccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role") === "sponsor" ? "sponsor" : "site";

  const isSite = role === "site";
  const title = isSite
    ? "Request Access — Clinical Site"
    : "Request Access — Sponsor";
  const Icon = isSite ? Building2 : Briefcase;
  const accentColor = isSite
    ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
    : "bg-violet-50 text-violet-600 ring-violet-100";
  const buttonColor = isSite
    ? "bg-emerald-600 hover:bg-emerald-700"
    : "bg-violet-600 hover:bg-violet-700";
  const orgTypes = isSite ? SITE_ORG_TYPES : SPONSOR_ORG_TYPES;

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    organizationName: "",
    organizationType: "",
    activeTrials: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/request-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Unable to submit request. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <HomeHeader />

      <div className="max-w-2xl mx-auto px-4 pt-20 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`p-3 rounded-xl ring-1 ${accentColor}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Fill out the form below and our team will be in touch within 1–2
              business days.
            </p>
          </div>
        </div>

        {/* Success state */}
        {success ? (
          <div className="rounded-2xl ring-1 ring-black/5 shadow-sm bg-white p-10 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Request submitted!</h2>
            <p className="text-gray-500 mb-6">
              Thank you! We'll review your request and be in touch within 1–2
              business days.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Back to home
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl ring-1 ring-black/5 shadow-sm bg-white p-8 space-y-5"
          >
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={form.fullName}
                onChange={handleChange}
                placeholder="Jane Smith"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition"
              />
            </div>

            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="organizationName"
                required
                value={form.organizationName}
                onChange={handleChange}
                placeholder="Acme Health Systems"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition"
              />
            </div>

            {/* Organization Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Organization Type <span className="text-red-500">*</span>
              </label>
              <select
                name="organizationType"
                required
                value={form.organizationType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition bg-white"
              >
                <option value="" disabled>
                  Select type…
                </option>
                {orgTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Number of active trials */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Number of Active Clinical Trials <span className="text-red-500">*</span>
              </label>
              <select
                name="activeTrials"
                required
                value={form.activeTrials}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition bg-white"
              >
                <option value="" disabled>
                  Select range…
                </option>
                {TRIAL_COUNT_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Brief description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Brief Description of Needs{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder="Tell us a bit about your current recruitment challenges or what you're hoping to accomplish with TrialClinIQ…"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 rounded-lg text-sm font-medium text-white transition-colors ${buttonColor} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">
                Reviewed and approved by our team within 1–2 business days.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
