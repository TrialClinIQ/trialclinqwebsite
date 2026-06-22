import React from "react";
import { useNavigate } from "react-router-dom";
import SiteHeader from "../../components/SiteHeader";
import { signUpUser } from "../../lib/entraId";
import { useAuth } from "../../lib/auth";
import { saveEligibilityToServer } from "../../lib/storage";
import LocationAutocomplete, { type LocationResult } from "../../components/LocationAutocomplete";

export default function SignupInfo(): JSX.Element {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [dob, setDob] = React.useState("");
  const [zip, setZip] = React.useState("");
  const [locationResult, setLocationResult] = React.useState<LocationResult | undefined>();
  const [distance, setDistance] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    password.length >= 8 &&
    passwordsMatch &&
    dob &&
    zip.trim() &&
    distance &&
    agreed;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await signUpUser({
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      signIn({
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        userId: result.userId,
        role: "patient",
      });

      // Persist only the fields we have — HealthEx will fill the rest
      try {
        await saveEligibilityToServer({
          dob,
          loc: zip,
          radius: distance,
          ...(locationResult ? { lat: locationResult.lat, lng: locationResult.lng } as any : {}),
        });
      } catch {
        // Non-blocking — EHR connection via HealthEx will enrich profile later
      }

      navigate("/patients/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteHeader />
      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold">Create your account</h1>
          <p className="mt-2 text-gray-500 text-sm">
            Once signed in, you'll connect your health records via HealthEx so we can match you to the right trials.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">First Name<span className="text-red-500">*</span></label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name<span className="text-red-500">*</span></label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email address<span className="text-red-500">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth<span className="text-red-500">*</span></label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-xs text-gray-400">Used to verify eligibility age requirements for trials.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LocationAutocomplete
              label="Your Location"
              required
              value={zip}
              onChange={(raw, result) => {
                setZip(raw);
                setLocationResult(result);
              }}
              placeholder="ZIP or City, State"
            />
            <div>
              <label className="block text-sm font-medium mb-1">Travel Distance<span className="text-red-500">*</span></label>
              <select
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">How far can you travel?</option>
                {["25mi", "50mi", "100mi", "200mi", "300mi", "500mi", "Any distance"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Password<span className="text-red-500">*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password<span className="text-red-500">*</span></label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                  confirmPassword && !passwordsMatch
                    ? "border-red-400 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                required
              />
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
              )}
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm text-gray-700 pt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <span>
              I agree to the{" "}
              <a href="/patients/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
              {" "}and consent to my health data being used for clinical trial matching under HIPAA-compliant protocols.
              You can revoke this at any time in Settings.
            </span>
          </label>

          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className={`w-full rounded-full py-3 text-sm font-semibold text-white transition-colors ${
              canSubmit && !isLoading
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-300 cursor-not-allowed"
            }`}
          >
            {isLoading ? "Creating account…" : "Create Account"}
          </button>

          <p className="text-center text-xs text-gray-400">
            Your health record data is collected after sign-in via HealthEx — we don't ask for it here.
          </p>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/patients/login")}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}
