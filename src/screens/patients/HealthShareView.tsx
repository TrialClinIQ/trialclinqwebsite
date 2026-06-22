import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Printer, ShieldCheck, AlertTriangle } from "lucide-react";

interface SharePayload {
  v?: number;
  n?: string;
  dob?: string;
  g?: string;
  bg?: string;
  c?: string[];
  m?: string[];
  a?: string[];
  ts?: number;
  src?: string;
}

function Section({ title, items, empty = "None on file" }: { title: string; items: string[]; empty?: string }) {
  return (
    <div className="py-4 border-b last:border-b-0">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{title}</div>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-gray-800 text-sm">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 italic">{empty}</p>
      )}
    </div>
  );
}

export default function HealthShareView() {
  const [params] = useSearchParams();

  const data = useMemo<SharePayload | null>(() => {
    const d = params.get("d");
    if (!d) return null;
    try {
      return JSON.parse(decodeURIComponent(atob(d)));
    } catch {
      return null;
    }
  }, [params]);

  const generatedAt = useMemo(() => {
    if (!data?.ts) return null;
    return new Date(data.ts * 1000).toLocaleString();
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid or expired link</h1>
          <p className="text-gray-500 text-sm">
            This health summary link is invalid or has expired. Please ask the patient to generate a new QR code from their TrialClinIQ dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print header */}
      <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between print:bg-black">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-sm font-semibold">TrialClinIQ · Patient Health Summary</div>
            <div className="text-xs text-gray-400">CMS Interoperability &amp; Patient Access Initiative</div>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-sm font-medium transition-colors print:hidden"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      <main className="max-w-xl mx-auto px-6 py-10">
        {/* Patient name + generated stamp */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">{data.n || "Patient"}</h1>
          {generatedAt && (
            <p className="mt-1 text-sm text-gray-400">Generated {generatedAt} · Source: {data.src || "TrialClinIQ"}</p>
          )}
        </div>

        {/* Demographics */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Demographics
          </div>
          <div className="px-5 divide-y">
            {[
              { label: "Date of Birth", value: data.dob ? new Date(data.dob + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "" },
              { label: "Biological Sex", value: data.g },
              { label: "Blood Group", value: data.bg },
            ]
              .filter((r) => r.value)
              .map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-gray-500 font-medium">{label}</span>
                  <span className="text-gray-900">{value}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Clinical data */}
        <div className="rounded-2xl border border-gray-200 px-5 divide-y mb-6">
          <Section title="Active Conditions / Diagnoses" items={data.c || []} />
          <Section title="Current Medications" items={data.m || []} />
          <Section title="Allergies &amp; Adverse Reactions" items={data.a || []} />
        </div>

        {/* Footer */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-xs text-blue-800 leading-relaxed">
          <strong>For providers:</strong> This summary was self-reported by the patient and/or sourced from their connected EHR via HealthEx. It does not replace clinical assessment. If data appears incomplete, request the patient connect additional providers in their TrialClinIQ account.
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Powered by TrialClinIQ · HIPAA-compliant patient data access · <a href="https://trialcliniq.com" className="underline hover:text-gray-600">trialcliniq.com</a>
        </p>
      </main>

      {/* Print-only styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}
