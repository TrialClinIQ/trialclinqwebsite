import { useNavigate, Link } from "react-router-dom";
import {
  UserRound, Building2, Briefcase, ArrowRight, CheckCircle2,
  Database, Shield, Brain, Activity, BarChart3, Network,
  Link2, Layers, Zap, TrendingUp,
} from "lucide-react";
import HomeHeader from "../components/HomeHeader";

const roles = [
  {
    icon: UserRound,
    title: "Participant",
    description: "I am a patient or healthy volunteer looking to find and join a clinical trial.",
    useCases: [
      "Connect and access your health data",
      "Get matched to clinical trials",
      "Share your health records with your care team",
    ],
    color: "bg-blue-50 text-blue-600 ring-blue-100",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    path: "/patients/signup-info",
  },
  {
    icon: Building2,
    title: "Clinical Site / Research Coordinator",
    description: "I represent a clinical site or research team managing trial recruitment.",
    useCases: [
      "Track and contact consented pre-screened participants",
      "Streamline recruitment and referrals",
      "Register your trial and manage eligibility",
    ],
    color: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    buttonColor: "bg-emerald-600 hover:bg-emerald-700",
    path: "/request-access?role=site",
    requestAccess: true,
  },
  {
    icon: Briefcase,
    title: "Sponsor",
    description: "I represent a pharmaceutical company, biotech, or CRO accelerating trial enrollment.",
    useCases: [
      "Track recruitment metrics in real time",
      "Monitor site performance across networks",
      "Access pre-screened, AI-matched candidates",
    ],
    color: "bg-violet-50 text-violet-600 ring-violet-100",
    buttonColor: "bg-violet-600 hover:bg-violet-700",
    path: "/request-access?role=sponsor",
    requestAccess: true,
  },
];

const pillars = [
  { label: "CONNECT", detail: "Sponsors with health systems at scale" },
  { label: "AGGREGATE", detail: "Real-world health records for intelligent matching" },
  { label: "ACCELERATE", detail: "Enrollment timelines with pre-screened candidates" },
  { label: "SCALE", detail: "Trials across partner networks nationwide" },
];

const solutions = [
  {
    icon: Database,
    title: "Real-World Data Infrastructure",
    body: "Unified data layer connecting health systems and sponsors, enabling seamless access to aggregated real-world health records for trial recruitment.",
  },
  {
    icon: Shield,
    title: "Compliant Data Aggregation",
    body: "HIPAA-compliant infrastructure that securely aggregates and normalizes health records from partner health systems for sponsor access.",
  },
  {
    icon: Brain,
    title: "AI-Powered Patient Matching",
    body: "Machine learning algorithms analyze real-world health records to identify and pre-screen eligible candidates against trial protocols.",
  },
  {
    icon: Activity,
    title: "CNS & Alzheimer's Focus",
    body: "Purpose-built for neurological trials, starting with Alzheimer's and expanding across CNS indications where recruitment is most challenging.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Enrollment Insights",
    body: "Dashboard visibility for sponsors into recruitment pipeline, site performance, and enrollment metrics across partner health systems.",
  },
  {
    icon: Network,
    title: "Health System Integration",
    body: "Direct EHR integrations with health systems and community health centers, creating a scalable network for clinical trial recruitment.",
  },
];

const steps = [
  { icon: Link2, step: "01", title: "Integrate Health Systems", body: "We connect directly to your EHR and health data infrastructure via FHIR-compliant APIs." },
  { icon: Layers, step: "02", title: "Define Trial Protocols", body: "Sponsors upload inclusion/exclusion criteria. Our platform normalizes them for AI matching." },
  { icon: Brain, step: "03", title: "AI Identifies Candidates", body: "Our algorithms scan aggregated records to surface pre-screened, eligible participants." },
  { icon: Zap, step: "04", title: "Deliver Qualified Candidates", body: "Consented candidates are routed to the right sites with full eligibility context." },
  { icon: TrendingUp, step: "05", title: "Track Enrollment Metrics", body: "Real-time dashboards surface funnel performance, site rankings, and conversion rates." },
];

export default function SignupSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-gray-900">
      <HomeHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(1200px 400px at 60% 20%, rgba(16,51,229,0.07), transparent 60%), radial-gradient(600px 300px at 30% 50%, rgba(16,229,157,0.07), transparent 60%)",
          }}
        />
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold mb-6 ring-1 ring-blue-100">
            HIPAA-Secure · AI-Powered · EHR-Connected
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Connecting Sponsors and Health Systems{" "}
            <br className="hidden sm:block" />
            Through AI-Powered Patient Matching
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Building the clinical trial recruitment data infrastructure of the future — using real-world health records and AI to accelerate enrollment across CNS, Alzheimer's, and beyond.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/patients/signup-info")}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-md"
            >
              Get Started as a Patient <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/request-access?role=sponsor"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Get a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Value pillars */}
      <section className="border-y bg-gray-50 py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {pillars.map((p) => (
            <div key={p.label}>
              <div className="text-xs font-bold tracking-widest text-blue-600 mb-1">{p.label}</div>
              <div className="text-sm text-gray-600">{p.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Solutions */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold">The Recruitment Infrastructure Stack</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">Everything needed to identify, match, and enroll the right patients — built for speed, compliance, and scale.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {solutions.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow bg-white">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 mb-4">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-semibold">How It Works</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">From health system integration to enrolled participants — a streamlined five-step process.</p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
            <div className="grid md:grid-cols-5 gap-6">
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.step} className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 rounded-full bg-white border-2 border-blue-100 flex items-center justify-center shadow-sm">
                        <Icon className="w-7 h-7 text-blue-600" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">{s.step}</span>
                    </div>
                    <div className="font-semibold text-sm mb-1">{s.title}</div>
                    <div className="text-xs text-gray-500 leading-relaxed">{s.body}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Patient access callout */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 p-10 md:p-14 text-white text-center">
          <h2 className="text-3xl font-semibold mb-4">Your Health Records, Working for You</h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8 leading-relaxed">
            Patients securely connect their electronic health records, grant consent, and let AI match them to trials they may never have found otherwise — without having to navigate complex medical jargon alone.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
            {[
              { label: "Consent-First", detail: "You control what's shared and with whom, always." },
              { label: "EHR-Connected", detail: "Pull data from your existing healthcare providers." },
              { label: "AI-Matched", detail: "Algorithms surface the trials most relevant to your profile." },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-2xl p-5">
                <div className="font-semibold mb-1">{item.label}</div>
                <div className="text-sm text-blue-100">{item.detail}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/patients/signup-info")}
            className="inline-flex items-center gap-2 rounded-full bg-white text-blue-700 font-semibold px-7 py-3 hover:bg-blue-50 transition-colors"
          >
            Create Patient Account <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Role selection */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold">Get Started</h2>
            <p className="mt-3 text-gray-500">Choose the role that best describes you</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.title}
                  onClick={() => navigate(role.path)}
                  className="group flex flex-col items-start text-left rounded-2xl ring-1 ring-black/5 p-7 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 bg-white"
                >
                  <div className={`p-3 rounded-xl ring-1 ${role.color} mb-5`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{role.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{role.description}</p>
                  <ul className="flex-1 space-y-2">
                    {role.useCases.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className={`mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${role.buttonColor}`}>
                    {role.requestAccess ? "Request Access" : "Get started"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  {role.requestAccess && (
                    <p className="text-xs text-gray-400 mt-2">Reviewed and approved by our team</p>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-center text-sm text-gray-500 mt-10">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/patients/login")}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </section>

      {/* Footer strip */}
      <footer className="border-t py-8 px-4 text-center text-xs text-gray-400">
        <p>© 2025 TrialClinIQ · HIPAA-Compliant · All rights reserved</p>
        <div className="mt-2 flex justify-center gap-6">
          <a href="https://trialcliniq.com/about" className="hover:text-gray-600">About</a>
          <a href="https://trialcliniq.com/contact" className="hover:text-gray-600">Contact</a>
          <a href="/patients/privacy" className="hover:text-gray-600">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
