"use client";

import type { LoadingStage } from "../page";

interface UploadFormProps {
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  jobText: string;
  setJobText: (text: string) => void;
  jobFile: File | null;
  setJobFile: (file: File | null) => void;
  onMatch: () => void;
  loading: boolean;
  loadingStage: LoadingStage;
  error: string | null;
}

export default function UploadForm({
  resumeFile,
  setResumeFile,
  jobText,
  setJobText,
  jobFile,
  setJobFile,
  onMatch,
  loading,
  loadingStage,
  error,
}: UploadFormProps) {
  // Mapping stages to human-readable text
  const getStageLabel = () => {
    switch (loadingStage) {
      case "resume":
        return "Parsing Resume Metadata...";
      case "job":
        return "Analyzing Job Requirements...";
      case "matching":
        return "Running Semantic Skill Match...";
      case "finalizing":
        return "Generating Intelligence Report...";
      default:
        return "Processing...";
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Resume Input */}
        <div className="group space-y-3">
          <label className="text-sm font-medium text-zinc-700 ml-1">
            Resume
          </label>
          <div className="relative h-48 rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 focus-within:ring-2 focus-within:ring-indigo-500/10">
            <input
              type="file"
              disabled={loading}
              accept=".pdf,.docx,.txt"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <p className="text-sm font-medium text-zinc-900">
                {resumeFile ? resumeFile.name : "Upload Resume"}
              </p>
              <p className="text-xs text-zinc-400">PDF, DOCX, or TXT</p>
            </div>
          </div>
        </div>

        {/* Job Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-700 ml-1">
            Job Description
          </label>
          <div className="flex flex-col h-48 rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all hover:border-zinc-300 focus-within:ring-2 focus-within:ring-indigo-500/10">
            <textarea
              value={jobText}
              disabled={loading}
              onChange={(e) => {
                setJobText(e.target.value);
                if (e.target.value) setJobFile(null);
              }}
              placeholder="Paste description or upload file..."
              className="flex-1 p-4 text-sm resize-none focus:outline-none text-zinc-700 disabled:bg-zinc-50/50"
            />
            <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
              <div className="relative">
                <input
                  type="file"
                  disabled={loading}
                  onChange={(e) => {
                    setJobFile(e.target.files?.[0] || null);
                    if (e.target.files?.[0]) setJobText("");
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <button className="text-xs font-semibold text-zinc-500 hover:text-zinc-900">
                  {jobFile ? jobFile.name : "Attach File Instead"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 animate-in fade-in zoom-in-95">
          {error}
        </div>
      )}

      {/* Dynamic Action Area */}
      <div className="relative">
        {!loading ? (
          <button
            onClick={onMatch}
            disabled={!resumeFile || (!jobFile && !jobText.trim())}
            className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-semibold transition-all active:scale-[0.99] disabled:opacity-20 shadow-sm"
          >
            Run Match Analysis
          </button>
        ) : (
          <div className="w-full bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col items-center space-y-6">
              {/* Stepper Visual */}
              <div className="flex items-center justify-between w-full max-w-xs relative">
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-zinc-100 -translate-y-1/2 z-0" />
                {["resume", "job", "matching"].map((s, i) => (
                  <div key={s} className="relative z-10">
                    <div
                      className={`w-3 h-3 rounded-full transition-all duration-500 ${
                        loadingStage === s
                          ? "bg-indigo-600 ring-4 ring-indigo-50 animate-pulse"
                          : i <
                              ["resume", "job", "matching"].indexOf(
                                loadingStage
                              ) || loadingStage === "finalizing"
                          ? "bg-emerald-500"
                          : "bg-zinc-200"
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-zinc-900 transition-all">
                  {getStageLabel()}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 mt-1 font-bold">
                  AI-Powered Assessment
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
