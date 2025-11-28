"use client";
import { useState } from "react";

export default function Home() {
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const formData = new FormData();
    formData.append("resume", e.target.files[0]);

    const res = await fetch("http://localhost:5000/api/parse-resume", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResumeText(data.text);
  };

  const generateCoverLetter = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/generate-cover-letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, jobDescription: jd }),
    });
    const data = await res.json();
    setResult(data.coverLetter);
    setLoading(false);
  };

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">AI Resume Builder</h1>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl mb-2">1. Upload Resume</h2>
          <input type="file" onChange={handleFileUpload} className="mb-4" />
          <textarea
            className="w-full h-40 p-2 border"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Parsed resume text will appear here..."
          />
        </div>

        <div>
          <h2 className="text-xl mb-2">2. Job Description</h2>
          <textarea
            className="w-full h-52 p-2 border"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste JD here..."
          />
        </div>
      </div>

      <button
        onClick={generateCoverLetter}
        className="bg-blue-600 text-white px-6 py-2 rounded mt-6 hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Cover Letter"}
      </button>

      {result && (
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-bold">Result:</h3>
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
}
