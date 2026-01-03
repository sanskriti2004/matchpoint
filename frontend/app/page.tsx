"use client";

import { useState } from "react";
import UploadForm from "./components/UploadForm";
import ResultsDisplay from "./components/ResultsDisplay";

interface MatchResult {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  ats_suggestions: string[];
  learning_resources: { skill: string; resource: string }[];
}

interface Job {
  file: File | null;
  text: string;
}

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobs, setJobs] = useState<Job[]>([{ file: null, text: "" }]);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMatch = async () => {
    if (!resumeFile || jobs.every((job) => !job.file && !job.text.trim()))
      return;
    setLoading(true);
    setError(null);
    try {
      const resumeForm = new FormData();
      resumeForm.append("file", resumeFile);
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const resumeRes = await fetch(`${backendUrl}/upload/resume`, {
        method: "POST",
        body: resumeForm,
      });
      if (!resumeRes.ok) throw new Error("Failed to upload resume");
      const resumeData = await resumeRes.json();

      const matchResults: MatchResult[] = [];
      for (const job of jobs) {
        if (!job.file && !job.text.trim()) continue;

        const jobForm = new FormData();
        if (job.file) {
          jobForm.append("file", job.file);
        } else {
          jobForm.append("text", job.text);
        }
        const jobRes = await fetch(`${backendUrl}/upload/job`, {
          method: "POST",
          body: jobForm,
        });
        if (!jobRes.ok) throw new Error("Failed to upload job description");
        const jobData = await jobRes.json();

        const matchRes = await fetch(`${backendUrl}/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume_id: resumeData.job_id,
            job_id: jobData.job_id,
          }),
        });
        if (!matchRes.ok) throw new Error("Failed to get match results");
        const matchData = await matchRes.json();
        matchResults.push(matchData);
      }
      setResults(matchResults);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <UploadForm
          resumeFile={resumeFile}
          setResumeFile={setResumeFile}
          jobs={jobs}
          setJobs={setJobs}
          onMatch={handleMatch}
          loading={loading}
          error={error}
        />
        <ResultsDisplay results={results} />
      </div>
    </div>
  );
}
