"use client";

import { useState } from "react";

interface Job {
  file: File | null;
  text: string;
}

interface UploadFormProps {
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  onMatch: () => void;
  loading: boolean;
  error: string | null;
}

export default function UploadForm({
  resumeFile,
  setResumeFile,
  jobs,
  setJobs,
  onMatch,
  loading,
  error,
}: UploadFormProps) {
  const addJob = () => {
    setJobs([...jobs, { file: null, text: "" }]);
  };

  const updateJob = (
    index: number,
    field: "file" | "text",
    value: File | string | null
  ) => {
    const newJobs = [...jobs];
    newJobs[index] = { ...newJobs[index], [field]: value };
    setJobs(newJobs);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Resume-Job Matching System
        </h1>
        <p className="text-gray-600">
          Upload your resume and compare against multiple job opportunities
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            Resume Document
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg text-gray-700 bg-white hover:border-blue-400 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-gray-500">
                {resumeFile ? resumeFile.name : "Choose resume file..."}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Job Opportunities
            </h2>
            <button
              onClick={addJob}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              Add Job
            </button>
          </div>

          {jobs.map((job, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Job {index + 1}</h3>
                {jobs.length > 1 && (
                  <button
                    onClick={() => setJobs(jobs.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <textarea
                value={job.text}
                onChange={(e) => updateJob(index, "text", e.target.value)}
                placeholder="Paste job description here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={4}
              />

              <div className="text-center text-gray-500 text-sm mb-3">or</div>

              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) =>
                  updateJob(index, "file", e.target.files?.[0] || null)
                }
                className="w-full px-4 py-3 border-2 border-dashed border-green-300 rounded-lg text-gray-700 bg-white hover:border-green-400 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            Error: {error}
          </div>
        )}

        <button
          onClick={onMatch}
          disabled={
            !resumeFile ||
            jobs.every((job) => !job.file && !job.text.trim()) ||
            loading
          }
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
        >
          {loading ? "Analyzing..." : "Match Resume to Jobs"}
        </button>
      </div>
    </div>
  );
}
