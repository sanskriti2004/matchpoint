"use client";

import { useState } from "react";

interface MatchResult {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  ats_suggestions: string[];
  learning_resources: { skill: string; resource: string }[];
}

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [jobText, setJobText] = useState<string>("");
  const [results, setResults] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMatch = async () => {
    if (!resumeFile || (!jobFile && !jobText.trim())) return;
    setLoading(true);
    setError(null);
    try {
      const resumeForm = new FormData();
      resumeForm.append("file", resumeFile);
      const resumeRes = await fetch("http://localhost:8000/upload/resume", {
        method: "POST",
        body: resumeForm,
      });
      if (!resumeRes.ok) throw new Error("Failed to upload resume");
      const resumeData = await resumeRes.json();

      const jobForm = new FormData();
      if (jobFile) {
        jobForm.append("file", jobFile);
      } else {
        jobForm.append("text", jobText);
      }
      const jobRes = await fetch("http://localhost:8000/upload/job", {
        method: "POST",
        body: jobForm,
      });
      if (!jobRes.ok) throw new Error("Failed to upload job description");
      const jobData = await jobRes.json();

      const matchRes = await fetch("http://localhost:8000/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: resumeData.job_id,
          job_id: jobData.job_id,
        }),
      });
      if (!matchRes.ok) throw new Error("Failed to get match results");
      const matchData = await matchRes.json();
      setResults(matchData);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Resume-Job Matching System
        </h1>
        <div className="space-y-6">
          <div className="mb-4">
            <label className="block mb-2 font-medium">Upload Resume:</label>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-medium">Job Description:</label>
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste job description here, or upload a file below"
              className="w-full border border-gray-300 rounded px-3 py-2 h-32 resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">Or upload a file:</p>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => setJobFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
            />
          </div>
          <button
            onClick={handleMatch}
            disabled={!resumeFile || (!jobFile && !jobText.trim()) || loading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {loading ? "Matching..." : "Match Resume & Job"}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
      {results && (
        <div className="max-w-2xl mx-auto mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Match Results</h2>
          <div className="mb-4">
            <strong>Match Score:</strong> {results.match_score}%
          </div>
          <div className="mb-4">
            <strong>Matching Skills:</strong>
            <ul className="list-disc list-inside ml-4">
              {results.matching_skills?.map((skill, idx) => (
                <li key={idx}>{skill}</li>
              )) || <li>No matching skills found</li>}
            </ul>
          </div>
          <div className="mb-4">
            <strong>Missing Skills:</strong>
            <ul className="list-disc list-inside ml-4">
              {results.missing_skills?.map((skill, idx) => (
                <li key={idx}>{skill}</li>
              )) || <li>No missing skills identified</li>}
            </ul>
          </div>
          <div className="mb-4">
            <strong>ATS Improvement Suggestions:</strong>
            <ul className="list-disc list-inside ml-4">
              {results.ats_suggestions?.map((suggestion, idx) => (
                <li key={idx}>{suggestion}</li>
              )) || <li>No suggestions available</li>}
            </ul>
          </div>
          <div className="mb-4">
            <strong>Learning Resources:</strong>
            <ul className="list-disc list-inside ml-4">
              {results.learning_resources?.map((resource, idx) => (
                <li key={idx}>
                  <a
                    href={resource.resource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {resource.skill}
                  </a>
                </li>
              )) || <li>No resources recommended</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
