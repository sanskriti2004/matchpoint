"use client";

import { useState } from "react";
import UploadForm from "./components/UploadForm";
import ResultsDisplay from "./components/ResultsDisplay";

export interface MatchResult {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  ats_suggestions: string[];
  learning_resources: { skill: string; resource: string }[];
}

// Define the possible stages for better UI feedback
export type LoadingStage =
  | "idle"
  | "resume"
  | "job"
  | "matching"
  | "finalizing";

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobText, setJobText] = useState("");
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleMatch = async () => {
    if (!resumeFile || (!jobFile && !jobText.trim())) return;

    setLoading(true);
    setError(null);
    setResult(null); // Clear previous results for a clean start

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

      // Stage 1: Resume Upload
      setLoadingStage("resume");
      const resumeForm = new FormData();
      resumeForm.append("file", resumeFile);
      const resumeRes = await fetch(`${backendUrl}/upload/resume`, {
        method: "POST",
        body: resumeForm,
      });
      if (!resumeRes.ok) throw new Error("Failed to upload resume");
      const resumeData = await resumeRes.json();

      // Stage 2: Job Description Upload
      setLoadingStage("job");
      const jobForm = new FormData();
      if (jobFile) {
        jobForm.append("file", jobFile);
      } else {
        jobForm.append("text", jobText);
      }
      const jobRes = await fetch(`${backendUrl}/upload/job`, {
        method: "POST",
        body: jobForm,
      });
      if (!jobRes.ok) throw new Error("Failed to upload job description");
      const jobData = await jobRes.json();

      // Stage 3: Matching Analysis
      setLoadingStage("matching");
      const matchRes = await fetch(`${backendUrl}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: resumeData.job_id,
          job_id: jobData.job_id,
        }),
      });
      if (!matchRes.ok) throw new Error("Failed to get match results");

      setLoadingStage("finalizing");
      const matchData = await matchRes.json();

      setResult(matchData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setLoadingStage("idle");
    }
  };

  return (
    <main className="min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-6 pt-16 md:pt-24">
        <header className="text-center mb-16">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            Match your potential.
          </h1>
          <p className="mt-4 text-lg text-zinc-500 max-w-2xl mx-auto">
            A minimal tool to align your professional profile with job
            requirements.
          </p>
        </header>

        <UploadForm
          resumeFile={resumeFile}
          setResumeFile={setResumeFile}
          jobText={jobText}
          setJobText={setJobText}
          jobFile={jobFile}
          setJobFile={setJobFile}
          onMatch={handleMatch}
          loading={loading}
          loadingStage={loadingStage}
          error={error}
        />

        {result && <ResultsDisplay result={result} />}
      </div>
    </main>
  );
}
