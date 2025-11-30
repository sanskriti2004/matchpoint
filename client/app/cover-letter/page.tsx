"use client";
import { useState } from "react";
import { PenTool, Upload, FileText, Copy, Check, Sparkles } from "lucide-react";

export default function CoverLetterPage() {
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append("resume", e.target.files[0]);

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/parse-resume", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResumeText(data.text);
    } catch (err) {
      alert("Failed to parse resume");
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "http://localhost:5000/api/generate-cover-letter",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume_text: resumeText,
            job_description: jd,
          }),
        }
      );
      const data = await res.json();
      setGeneratedLetter(data.coverLetter);
    } catch (err) {
      alert("Failed to generate letter");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <PenTool className="text-purple-600" /> AI Cover Letter
        </h2>
        <p className="text-slate-500">
          Generate a persuasive cover letter tailored to the job description.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        {/* Left Column: Inputs */}
        <div className="space-y-6 overflow-y-auto pr-2">
          {/* Resume Input */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-slate-700">
              <span className="bg-slate-100 p-1.5 rounded-md">
                <FileText size={16} />
              </span>
              Your Resume
            </h3>

            {!resumeText ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition relative cursor-pointer group">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-purple-600 transition">
                  <Upload size={32} />
                  <span className="font-medium text-sm">Upload PDF Resume</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                    <Check size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Resume Loaded
                    </p>
                    <p className="text-xs text-emerald-600">
                      {resumeText.substring(0, 50)}...
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResumeText("")}
                  className="absolute top-2 right-2 text-xs text-slate-400 hover:text-red-500 underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* JD Input */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[300px]">
            <h3 className="font-semibold mb-4 text-slate-700">
              Job Description
            </h3>
            <textarea
              className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none text-sm"
              placeholder="Paste the job description here..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          </div>

          <button
            onClick={generate}
            disabled={!resumeText || !jd || loading}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Sparkles className="animate-spin" size={20} /> Writing magic...
              </>
            ) : (
              <>
                <Sparkles size={20} /> Generate Cover Letter
              </>
            )}
          </button>
        </div>

        {/* Right Column: Output */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
          <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Preview
            </span>
            {generatedLetter && (
              <button
                onClick={copyToClipboard}
                className="text-slate-500 hover:text-purple-600 flex items-center gap-1.5 text-xs font-medium transition"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Text"}
              </button>
            )}
          </div>

          <div className="flex-1 p-8 overflow-y-auto bg-white">
            {generatedLetter ? (
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap font-serif text-slate-700 leading-relaxed">
                  {generatedLetter}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <PenTool size={48} className="mb-4 opacity-20" />
                <p className="text-sm">
                  Your AI-generated letter will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
