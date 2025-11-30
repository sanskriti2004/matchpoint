"use client";
import { useState } from "react";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import ScoreGauge from "@/components/ScoreGauge";

interface AtsResult {
  score: number;
  missing: string[];
  matching: string[];
}

export default function ScannerPage() {
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<AtsResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Reuse logic from previous commit, just styling changes
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append("resume", e.target.files[0]);

    // Assume backend is on port 5000
    const res = await fetch("http://localhost:5000/api/parse-resume", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResumeText(data.text);
  };

  const analyze = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/ats-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_text: resumeText, job_description: jd }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Input Column */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <Upload size={18} />
            </span>
            1. Upload Resume
          </h2>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition cursor-pointer relative">
            <input
              type="file"
              onChange={handleUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <p className="text-slate-500 font-medium">
              Drop PDF here or click to upload
            </p>
            {resumeText && (
              <p className="text-emerald-600 text-sm mt-2 font-semibold">
                ✓ Resume Loaded
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[400px] flex flex-col">
          <h2 className="font-bold text-lg mb-4">2. Job Description</h2>
          <textarea
            className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            placeholder="Paste the job description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </div>

        <button
          onClick={analyze}
          disabled={!resumeText || !jd || loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Run ATS Scan"}
        </button>
      </div>

      {/* Results Column */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[600px]">
        {!result ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <ScanSearchIcon size={64} className="mb-4 opacity-20" />
            <p>Results will appear here after scanning</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold mb-6 text-center">Match Report</h3>

            <ScoreGauge score={result.score} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  <CheckCircle size={18} /> Matched Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.matching.map((s) => (
                    <span
                      key={s}
                      className="bg-white text-emerald-700 px-2 py-1 rounded text-xs border border-emerald-100 shadow-sm"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                  <XCircle size={18} /> Missing Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.missing.map((s) => (
                    <span
                      key={s}
                      className="bg-white text-red-700 px-2 py-1 rounded text-xs border border-red-100 shadow-sm"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScanSearchIcon({
  size,
  className,
}: {
  size: number;
  className: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 21" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
