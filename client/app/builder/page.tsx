"use client";
import { useState } from "react";
import { Github, Download, RefreshCw, FileText } from "lucide-react";

export default function BuilderPage() {
  const [username, setUsername] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const ghRes = await fetch(`http://localhost:5000/api/github/${username}`);
      const ghData = await ghRes.json();

      const aiRes = await fetch("http://localhost:5000/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubData: ghData }),
      });
      const aiData = await aiRes.json();
      setGeneratedHtml(aiData.resumeContent);
    } catch (err) {
      alert("Error fetching data");
    }
    setLoading(false);
  };

  const downloadPdf = async () => {
    const res = await fetch("http://localhost:5000/api/download-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeContent: generatedHtml }),
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.pdf";
    a.click();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Resume Builder</h2>
          <p className="text-slate-500">
            Import from GitHub and let AI structure your CV.
          </p>
        </div>
        {generatedHtml && (
          <button
            onClick={downloadPdf}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
          >
            <Download size={18} /> Download PDF
          </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left Panel: Inputs */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-y-auto">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              GitHub Username
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Github
                  className="absolute left-3 top-3 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="torvalds"
                />
              </div>
              <button
                onClick={generate}
                disabled={loading || !username}
                className="bg-slate-900 text-white px-4 rounded-lg hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" /> : "Build"}
              </button>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-800">
            <h4 className="font-bold mb-1">AI Tip</h4>
            <p>
              Ensure your GitHub bio and top pinned repositories have good
              descriptions. The AI uses these to write your summary.
            </p>
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="lg:col-span-8 bg-slate-200 rounded-2xl border border-slate-300 overflow-hidden flex flex-col">
          <div className="bg-slate-800 text-white p-2 text-xs text-center font-mono">
            LIVE PREVIEW (A4)
          </div>
          <div className="flex-1 overflow-y-auto p-8 flex justify-center">
            {generatedHtml ? (
              <div
                className="bg-white shadow-2xl w-[210mm] min-h-[297mm] p-[10mm] text-sm"
                dangerouslySetInnerHTML={{ __html: generatedHtml }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 h-full">
                <FileText size={48} className="mb-4 opacity-50" />
                <p>Generated resume will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
