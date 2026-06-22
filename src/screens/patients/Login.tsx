import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Loader2, Shield } from "lucide-react";
import { consumePostLoginRedirect, useAuth } from "../../lib/auth";
import {
  signInUser,
  signInWithGoogle,
  extractMFAResolver,
  getMFAHints,
  sendMFASMS,
  completeMFAWithSMS,
  completeMFAWithTOTP,
  type MultiFactorResolver,
} from "../../lib/entraId";
import SiteHeader from "../../components/SiteHeader";

type Step =
  | "choose"          // Google or Email
  | "email"           // email + password form
  | "mfa_select"      // choose second factor (SMS or Authenticator)
  | "mfa_sms_sending" // waiting for SMS to send
  | "mfa_sms_code"    // enter SMS code
  | "mfa_totp";       // enter Google Authenticator code

export default function Login(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signIn, user } = useAuth();

  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [mfaHints, setMfaHints] = useState<ReturnType<typeof getMFAHints>>([]);
  const [smsVerificationId, setSmsVerificationId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const recaptchaRef = useRef<HTMLDivElement>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname as string | undefined;
      const fallback = user?.role === "provider" ? "/providers/dashboard" : "/patients/dashboard";
      navigate(consumePostLoginRedirect(from || fallback), { replace: true });
    }
  }, [isAuthenticated]);

  function afterSignIn(u: { email: string; firstName: string; lastName: string; userId: string }) {
    localStorage.setItem("pending_role_v1", "patient");
    signIn({ ...u, role: "patient" });
    const from = (location.state as any)?.from?.pathname as string | undefined;
    navigate(consumePostLoginRedirect(from || "/patients/dashboard"), { replace: true });
  }

  function handleMFARequired(err: unknown) {
    const resolver = extractMFAResolver(err);
    if (!resolver) throw err as Error;
    const hints = getMFAHints(resolver);
    setMfaResolver(resolver);
    setMfaHints(hints);
    // If only one factor enrolled, skip the selection screen
    if (hints.length === 1) {
      if (hints[0].factorId === "phone") {
        startSMSFlow(resolver, hints[0]);
      } else {
        setStep("mfa_totp");
      }
    } else {
      setStep("mfa_select");
    }
  }

  // ── Email / password ───────────────────────────────────────────────────────
  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await signInUser({ email: email.trim(), password });
      if (u) afterSignIn(u);
    } catch (err: any) {
      const resolver = extractMFAResolver(err);
      if (resolver) {
        setLoading(false);
        handleMFARequired(err);
      } else {
        setError(err?.message || "Invalid email or password.");
        setLoading(false);
      }
    }
  }

  // ── Google ─────────────────────────────────────────────────────────────────
  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      const u = await signInWithGoogle();
      afterSignIn(u);
    } catch (err: any) {
      if (err?.code === "auth/multi-factor-auth-required") {
        setLoading(false);
        handleMFARequired(err);
        return;
      }
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(err?.message || "Google sign-in failed. Please try again.");
      }
      setLoading(false);
    }
  }

  // ── MFA: SMS ───────────────────────────────────────────────────────────────
  async function startSMSFlow(
    resolver: MultiFactorResolver,
    hint: ReturnType<typeof getMFAHints>[number],
  ) {
    setStep("mfa_sms_sending");
    setError("");
    try {
      const verificationId = await sendMFASMS(resolver, "recaptcha-container");
      setSmsVerificationId(verificationId);
      setStep("mfa_sms_code");
    } catch (err: any) {
      setError(err?.message || "Failed to send SMS. Please try again.");
      setStep("mfa_select");
    }
  }

  async function handleSMSVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await completeMFAWithSMS(mfaResolver!, smsVerificationId, code.trim());
      afterSignIn(u);
    } catch (err: any) {
      setError(err?.message || "Invalid code. Please try again.");
      setLoading(false);
    }
  }

  // ── MFA: TOTP (Google Authenticator) ──────────────────────────────────────
  async function handleTOTPVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await completeMFAWithTOTP(mfaResolver!, code.trim());
      afterSignIn(u);
    } catch (err: any) {
      setError(err?.message || "Invalid code. Please check your Authenticator app and try again.");
      setLoading(false);
    }
  }

  // ── Dev demo ───────────────────────────────────────────────────────────────
  function handleDemo() {
    const demo = { email: "demo@trialcliniq.com", firstName: "Demo", lastName: "Patient", userId: "demo-12345" };
    localStorage.setItem("tc_health_profile_v1", JSON.stringify({
      patientId: "demo-12345", email: demo.email, emailVerified: true, age: "45",
      primaryCondition: "Diabetes", medications: [{ name: "Metformin" }],
    }));
    afterSignIn(demo);
  }

  const isMFAStep = ["mfa_select", "mfa_sms_sending", "mfa_sms_code", "mfa_totp"].includes(step);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <div id="recaptcha-container" ref={recaptchaRef} />

      <main className="max-w-sm mx-auto px-4 py-12">
        {/* Back button */}
        {step !== "choose" && (
          <button
            onClick={() => { setStep("choose"); setError(""); setCode(""); setMfaResolver(null); }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          {isMFAStep && (
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-blue-50 p-3">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          )}
          <h1 className="text-2xl font-semibold text-gray-900">
            {step === "choose" && "Sign in to TrialClinIQ"}
            {step === "email" && "Sign in with email"}
            {step === "mfa_select" && "Two-step verification"}
            {step === "mfa_sms_sending" && "Sending code…"}
            {step === "mfa_sms_code" && "Check your phone"}
            {step === "mfa_totp" && "Authenticator app"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {step === "choose" && "Access your clinical trial matches"}
            {step === "mfa_select" && "Choose how to verify your identity"}
            {step === "mfa_sms_code" && `Enter the code sent to ${mfaHints.find(h => h.factorId === "phone")?.phoneNumber || "your phone"}`}
            {step === "mfa_totp" && "Open Google Authenticator (or Authy) and enter the 6-digit code"}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── CHOOSE METHOD ── */}
        {step === "choose" && (
          <div className="space-y-3">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </button>

            <button
              onClick={() => { setStep("email"); setError(""); }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m2 7 10 7 10-7" />
              </svg>
              Continue with Email
            </button>

            <div className="pt-4 text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <button onClick={() => navigate("/signup")} className="text-blue-600 hover:underline font-medium">
                Sign up
              </button>
            </div>
          </div>
        )}

        {/* ── EMAIL / PASSWORD ── */}
        {step === "email" && (
          <form onSubmit={handleEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        )}

        {/* ── MFA: CHOOSE FACTOR ── */}
        {step === "mfa_select" && (
          <div className="space-y-3">
            {mfaHints.map((hint) => (
              <button
                key={hint.uid}
                onClick={() => {
                  if (hint.factorId === "phone") {
                    startSMSFlow(mfaResolver!, hint);
                  } else {
                    setStep("mfa_totp");
                  }
                }}
                className="w-full flex items-start gap-4 rounded-xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-gray-50 transition"
              >
                <div className="text-2xl mt-0.5">
                  {hint.factorId === "phone" ? "📱" : "🔐"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {hint.factorId === "phone" ? "Text message (SMS)" : "Authenticator app"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {hint.factorId === "phone"
                      ? `Send a code to ${hint.phoneNumber || "your phone"}`
                      : "Use Google Authenticator or Authy"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── MFA: SMS SENDING ── */}
        {step === "mfa_sms_sending" && (
          <div className="flex flex-col items-center gap-3 py-8 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm">Sending verification code…</p>
          </div>
        )}

        {/* ── MFA: SMS CODE INPUT ── */}
        {step === "mfa_sms_code" && (
          <form onSubmit={handleSMSVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">6-digit code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Verifying…" : "Verify"}
            </button>
          </form>
        )}

        {/* ── MFA: TOTP CODE INPUT ── */}
        {step === "mfa_totp" && (
          <form onSubmit={handleTOTPVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">6-digit code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-400 text-center">
                The code changes every 30 seconds
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Verifying…" : "Verify"}
            </button>
          </form>
        )}

        {/* Dev demo */}
        {import.meta.env.DEV && step === "choose" && (
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-xs text-gray-400 mb-2">Dev only</p>
            <button onClick={handleDemo} className="text-xs text-gray-400 hover:text-gray-600 underline">
              Login as demo patient
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
