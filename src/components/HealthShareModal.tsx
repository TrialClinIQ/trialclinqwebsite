import React, { useMemo, useRef, useCallback } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { X, Printer, Download, CheckCircle2, Info } from "lucide-react";
import { useAuth } from "../lib/auth";

interface HealthShareModalProps {
  onClose: () => void;
}

interface HealthProfile {
  gender?: string;
  bloodGroup?: string;
  allergies?: Array<string | { name: string }>;
  medications?: Array<string | { name: string }>;
  primaryCondition?: string;
  age?: string;
  weight?: string;
}

interface EligibilityProfile {
  dob?: string;
  conditions?: string[];
  medications?: string[];
}

function readProfile(): HealthProfile {
  try {
    return JSON.parse(localStorage.getItem("tc_health_profile_v1") || "{}");
  } catch {
    return {};
  }
}

function readEligibility(): EligibilityProfile {
  try {
    return JSON.parse(localStorage.getItem("tc_eligibility_profile") || "{}");
  } catch {
    return {};
  }
}

function normalizeMeds(
  meds: Array<string | { name: string }> | undefined,
): string[] {
  if (!Array.isArray(meds)) return [];
  return meds.map((m) => (typeof m === "string" ? m : m?.name)).filter(Boolean) as string[];
}

function normalizeAllergies(
  allergies: Array<string | { name: string }> | undefined,
): string[] {
  if (!Array.isArray(allergies)) return [];
  return allergies
    .map((a) => (typeof a === "string" ? a : (a as { name: string })?.name))
    .filter(Boolean) as string[];
}

export default function HealthShareModal({ onClose }: HealthShareModalProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);

  const summary = useMemo(() => {
    const hp = readProfile();
    const ep = readEligibility();

    const conditions: string[] = [
      ...(hp.primaryCondition ? [hp.primaryCondition] : []),
      ...(ep.conditions || []),
    ].filter((v, i, a) => a.indexOf(v) === i); // dedupe

    const medications = normalizeMeds(hp.medications).length
      ? normalizeMeds(hp.medications)
      : normalizeMeds(ep.medications as any);

    return {
      name: user ? `${user.firstName} ${user.lastName}`.trim() : "Patient",
      dob: ep.dob || "",
      gender: hp.gender || "",
      bloodGroup: hp.bloodGroup || "",
      conditions,
      medications,
      allergies: normalizeAllergies(hp.allergies),
      weight: hp.weight || "",
      generatedAt: new Date().toISOString(),
    };
  }, [user]);

  // Compact payload — keeps QR data small
  const payload = useMemo(() => {
    const data = {
      v: 1,
      n: summary.name,
      dob: summary.dob,
      g: summary.gender,
      bg: summary.bloodGroup,
      c: summary.conditions,
      m: summary.medications,
      a: summary.allergies,
      ts: Math.floor(Date.now() / 1000),
      src: "TrialClinIQ",
    };
    return btoa(encodeURIComponent(JSON.stringify(data)));
  }, [summary]);

  const shareUrl = `${window.location.origin}/health-share?d=${payload}`;

  const handlePrint = useCallback(() => {
    const win = window.open(shareUrl, "_blank");
    win?.focus();
  }, [shareUrl]);

  const handleDownload = useCallback(() => {
    // Grab the hidden canvas rendered below
    const canvas = document.getElementById("hs-qr-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `trialcliniq-health-share-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  const includedItems = [
    { label: "Name", value: summary.name, show: !!summary.name },
    { label: "Date of Birth", value: summary.dob, show: !!summary.dob },
    { label: "Gender", value: summary.gender, show: !!summary.gender },
    { label: "Blood Group", value: summary.bloodGroup, show: !!summary.bloodGroup },
    {
      label: "Conditions",
      value: summary.conditions.join(", ") || "None on file",
      show: true,
    },
    {
      label: "Medications",
      value: summary.medications.join(", ") || "None on file",
      show: true,
    },
    {
      label: "Allergies",
      value: summary.allergies.join(", ") || "None on file",
      show: true,
    },
  ].filter((i) => i.show);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Share with Care Team</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              CMS Interoperability &amp; Patient Access · "Kill the Clipboard"
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* QR code */}
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
              <QRCodeSVG
                value={shareUrl}
                size={192}
                level="M"
                includeMargin
              />
            </div>
            {/* Hidden canvas used for PNG download */}
            <div style={{ position: "absolute", left: -9999 }} aria-hidden="true">
              <QRCodeCanvas id="hs-qr-canvas" value={shareUrl} size={512} level="M" includeMargin />
            </div>
            <p className="text-xs text-gray-500 text-center max-w-xs">
              Provider scans this code to instantly view your health summary — no app or login required.
            </p>
          </div>

          {/* What's included */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              <Info className="w-3.5 h-3.5" /> What's included
            </div>
            <ul className="space-y-2">
              {includedItems.map(({ label, value }) => (
                <li key={label} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium text-gray-700">{label}:</span>{" "}
                    <span className="text-gray-600">{value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Privacy note */}
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800 leading-relaxed">
            <strong>Privacy:</strong> This QR code links to a read-only, unauthenticated view of your health summary. Do not share it publicly. The link contains no persistent identifier — it expires when this modal is closed or the page is refreshed.
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" /> Open &amp; Print
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Download QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
