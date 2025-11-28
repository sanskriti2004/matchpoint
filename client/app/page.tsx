"use client";
import { useState } from "react";

export default function Home() {
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [generatedResume, setGeneratedResume] = useState("");

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

  // Function to handle the whole flow
  const handleGithubGenerate = async () => {
    setLoading(true);

    // 1. Fetch Data
    const ghRes = await fetch(`http://localhost:5000/api/github/${username}`);
    const ghData = await ghRes.json();

    // 2. Generate Resume Text via AI
    const aiRes = await fetch("http://localhost:5000/api/generate-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ githubData: ghData }),
    });
    const aiData = await aiRes.json();
    setGeneratedResume(aiData.resumeContent);
    setLoading(false);
  };

  const downloadPdf = async () => {
    const res = await fetch("http://localhost:5000/api/download-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeContent: generatedResume }),
    });

    // Trigger file download in browser
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${username}_resume.pdf`;
    a.click();
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

      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Or Generate from GitHub</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="GitHub Username"
            className="border p-2 rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            onClick={handleGithubGenerate}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            {loading ? "Fetching & Writing..." : "Generate Resume"}
          </button>
        </div>

        {generatedResume && (
          <div className="mt-6">
            <h3 className="font-bold">AI Generated Resume:</h3>
            <textarea
              value={generatedResume}
              className="w-full h-64 p-2 border mt-2"
              readOnly
            />
            <button
              onClick={downloadPdf}
              className="bg-purple-600 text-white px-6 py-2 rounded mt-4"
            >
              Download PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
