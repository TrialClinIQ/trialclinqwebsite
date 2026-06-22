import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import SiteHeader from "../../components/SiteHeader";
import {
  getEnrolledFactors,
  startTotpEnrollment,
  finishTotpEnrollment,
  startSmsEnrollment,
  finishSmsEnrollment,
  unenrollFactor,
} from "../../lib/entraId";
import { PhoneMultiFactorGenerator, TotpMultiFactorGenerator } from "firebase/auth";

type Step =
  | "overview"
  | "totp_qr"
  | "totp_verify"
  | "sms_phone"
  | "sms_verify";

interface EnrolledFactor {
  uid: string;
  factorId: string;
  displayName: string | null;
}

export default function MFASetup(): JSX.Element {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("overview");
  const [enrolled, setEnrolled] = useState<EnrolledFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // TOTP state
  const [totpSecret, setTotpSecret] = useState<any>(null);
  const [totpQr, setTotpQr] = useState("");
  const [totpCode, setTotpCode] = useState("");

  // SMS state
  const [phone, setPhone] = useState("");
  const [smsVerificationId, setSmsVerificationId] = useState("");
  const [smsCode, setSmsCode] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const factors = await getEnrolledFactors();
      setEnrolled(
        factors.map((f) => ({
          uid: f.uid,
          factorId: f.factorId,
          displayName: f.displayName ?? null,
        }))
      );
    } catch (e) {
      setError("Could not load enrolled factors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // ── TOTP flow ──────────────────────────────────────────────────────────────

  async function handleStartTotp() {
    setError("");
    setBusy(true);
    try {
      const { secret, qrCodeUrl } = await startTotpEnrollment();
      setTotpSecret(secret);
      setTotpQr(qrCodeUrl);
      setTotpCode("");
      setStep("totp_qr");
    } catch (e: any) {
      setError(e?.message || "Failed to start authenticator setup.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFinishTotp() {
    if (totpCode.length !== 6) return;
    setError("");
    setBusy(true);
    try {
      await finishTotpEnrollment(totpSecret, totpCode);
      await refresh();
      setStep("overview");
    } catch (e: any) {
      setError(e?.message || "Invalid code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // ── SMS flow ───────────────────────────────────────────────────────────────

  async function handleSendSms() {
    const cleaned = phone.replace(/\s+/g, "");
    if (!cleaned.startsWith("+")) {
      setError("Enter your phone number in international format, e.g. +1 415 555 1234");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const vid = await startSmsEnrollment(cleaned, "recaptcha-container-mfa");
      setSmsVerificationId(vid);
      setSmsCode("");
      setStep("sms_verify");
    } catch (e: any) {
      setError(e?.message || "Failed to send SMS. Check the number and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFinishSms() {
    if (smsCode.length < 4) return;
    setError("");
    setBusy(true);
    try {
      await finishSmsEnrollment(smsVerificationId, smsCode);
      await refresh();
      setStep("overview");
    } catch (e: any) {
      setError(e?.message || "Invalid code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // ── Remove factor ──────────────────────────────────────────────────────────

  async function handleUnenroll(uid: string) {
    if (!confirm("Remove this second factor? You can add it again later.")) return;
    setError("");
    setBusy(true);
    try {
      await unenrollFactor(uid);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to remove factor.");
    } finally {
      setBusy(false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const hasTOTP = enrolled.some((f) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID);
  const hasSMS = enrolled.some((f) => f.factorId === PhoneMultiFactorGenerator.FACTOR_ID);

  function factorLabel(f: EnrolledFactor) {
    if (f.factorId === TotpMultiFactorGenerator.FACTOR_ID) return "Authenticator App";
    if (f.factorId === PhoneMultiFactorGenerator.FACTOR_ID) return f.displayName || "Phone";
    return f.displayName || f.factorId;
  }

  function factorIcon(factorId: string) {
    if (factorId === TotpMultiFactorGenerator.FACTOR_ID) {
      return (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteHeader />

      {/* Invisible reCAPTCHA anchor for SMS */}
      <div id="recaptcha-container-mfa" />

      <main className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <button
          onClick={() => step === "overview" ? navigate("/patients/dashboard") : setStep("overview")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {step === "overview" ? "Back to Dashboard" : "Back"}
        </button>

        <h1 className="text-2xl font-semibold mb-1">Two-Factor Authentication</h1>
        <p className="text-sm text-gray-500 mb-8">
          Add a second layer of security to your account. After signing in you'll be asked to verify with your phone or authenticator app.
        </p>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {step === "overview" && (
          <>
            {/* Enrolled factors */}
            {!loading && enrolled.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Active second factors
                </h2>
                <div className="space-y-2">
                  {enrolled.map((f) => (
                    <div
                      key={f.uid}
                      className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        {factorIcon(f.factorId)}
                        <span className="text-sm font-medium">{factorLabel(f)}</span>
                      </div>
                      <button
                        onClick={() => handleUnenroll(f.uid)}
                        disabled={busy}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="text-sm text-gray-400 mb-8">Loading…</div>
            )}

            {/* Add new factor */}
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              {enrolled.length === 0 ? "Add a second factor" : "Add another factor"}
            </h2>

            <div className="space-y-3">
              {/* TOTP */}
              <button
                onClick={handleStartTotp}
                disabled={busy || hasTOTP}
                className={`w-full flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition ${
                  hasTOTP
                    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <div className="rounded-full bg-blue-100 p-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Authenticator App
                    {hasTOTP && <span className="ml-2 text-xs text-green-600 font-normal">Enrolled</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    Google Authenticator, Authy, or any TOTP app
                  </p>
                </div>
              </button>

              {/* SMS */}
              <button
                onClick={() => { setStep("sms_phone"); setPhone(""); setError(""); }}
                disabled={busy || hasSMS}
                className={`w-full flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition ${
                  hasSMS
                    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <div className="rounded-full bg-blue-100 p-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Text Message (SMS)
                    {hasSMS && <span className="ml-2 text-xs text-green-600 font-normal">Enrolled</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    Receive a one-time code via text
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── TOTP: SHOW QR ────────────────────────────────────────────────── */}
        {step === "totp_qr" && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              Scan this QR code with <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app.
            </p>

            {totpQr && (
              <div className="inline-block p-4 bg-white border border-gray-200 rounded-2xl mb-6 shadow-sm">
                <QRCodeSVG value={totpQr} size={200} />
              </div>
            )}

            <p className="text-xs text-gray-400 mb-1">Can't scan? Enter this secret manually:</p>
            <p className="font-mono text-sm bg-gray-100 rounded-lg px-4 py-2 inline-block mb-8 break-all">
              {totpSecret?.secretKey || ""}
            </p>

            <button
              onClick={() => setStep("totp_verify")}
              className="w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              I've scanned it — next
            </button>
          </div>
        )}

        {/* ── TOTP: VERIFY CODE ────────────────────────────────────────────── */}
        {step === "totp_verify" && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              Enter the 6-digit code shown in your authenticator app to confirm enrollment.
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full text-center text-2xl font-mono tracking-[0.4em] rounded-xl border border-gray-300 px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleFinishTotp}
              disabled={totpCode.length !== 6 || busy}
              className="w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {busy ? "Verifying…" : "Confirm & Enroll"}
            </button>
          </div>
        )}

        {/* ── SMS: ENTER PHONE ─────────────────────────────────────────────── */}
        {step === "sms_phone" && (
          <div>
            <p className="text-sm text-gray-600 mb-6">
              Enter your mobile number in international format. We'll send a verification code.
            </p>

            <label className="block text-sm font-medium mb-1">
              Phone number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 415 555 1234"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleSendSms}
              disabled={phone.trim().length < 8 || busy}
              className="w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {busy ? "Sending…" : "Send Code"}
            </button>
          </div>
        )}

        {/* ── SMS: VERIFY CODE ─────────────────────────────────────────────── */}
        {step === "sms_verify" && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              Enter the code we just sent to <strong>{phone}</strong>.
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full text-center text-2xl font-mono tracking-[0.4em] rounded-xl border border-gray-300 px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleFinishSms}
              disabled={smsCode.length < 4 || busy}
              className="w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {busy ? "Verifying…" : "Confirm & Enroll"}
            </button>

            <button
              onClick={() => { setStep("sms_phone"); setError(""); }}
              className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Change number
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
