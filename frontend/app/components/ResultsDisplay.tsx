"use client";

import { useState } from "react";

interface LearningResource {
  skill: string;
  free_tutorial: string;
  official_resource: string;
  explore: string;
}

interface MatchResult {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  ats_suggestions: string[];
  learning_resources: LearningResource[];
}

interface ResultsDisplayProps {
  result: MatchResult | null;
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());

  if (!result) return null;

  const score = result.match_score;
  const getProgressColor = () => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  const toggleSkill = (skill: string) => {
    setExpandedSkills((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(skill)) {
        newSet.delete(skill);
      } else {
        newSet.add(skill);
      }
      return newSet;
    });
  };

  return (
    <div className="mt-20 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
          Match Analysis
        </span>
        <div className="flex flex-col items-center">
          <span
            className={`text-7xl font-light tracking-tighter ${score >= 80 ? "text-zinc-900" : "text-zinc-700"
              }`}
          >
            {score}%
          </span>
          <div className="w-48 h-1 bg-zinc-100 rounded-full mt-6 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-out ${getProgressColor()}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-zinc-100">
        <div className="space-y-10">
          <section>
            <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Matching Strengths
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.matching_skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-xs font-medium border border-zinc-200/50"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Identified Gaps
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.missing_skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white text-zinc-500 rounded-full text-xs font-medium border border-zinc-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <section className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">
              ATS Recommendations
            </h3>
            <ul className="space-y-3">
              {result.ats_suggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-zinc-600 flex gap-3">
                  <span className="text-zinc-300 font-mono text-[10px] mt-1">
                    0{i + 1}
                  </span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">
              Upskilling Resources
            </h3>
            <div className="space-y-3">
              {result.learning_resources.map((res, i) => {
                const isExpanded = expandedSkills.has(res.skill);
                return (
                  <div
                    key={i}
                    className="group border border-zinc-200 rounded-lg bg-white overflow-hidden transition-all duration-200 hover:border-zinc-300"
                  >
                    <button
                      onClick={() => toggleSkill(res.skill)}
                      className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-zinc-50"
                    >
                      <span className="text-sm font-medium text-zinc-900 capitalize">
                        {res.skill}
                      </span>
                      <svg
                        className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? "rotate-180 text-zinc-600" : ""
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    <div
                      className={`transition-all duration-300 ease-[cubic-bezier(0.87,0,0.13,1)] ${isExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                        }`}
                    >
                      <div className="border-t border-zinc-100 bg-zinc-50/50">
                        <div className="flex flex-col">
                          {res.free_tutorial && (
                            <a
                              href={res.free_tutorial}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-3 hover:bg-white border-b border-zinc-100 last:border-0 transition-colors group/link"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-zinc-900">Free Tutorial</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">Video</span>
                                </div>
                                <p className="text-xs text-zinc-500 truncate group-hover/link:text-zinc-600 mt-0.5">
                                  Start learning broadly
                                </p>
                              </div>
                              <svg className="w-4 h-4 text-zinc-300 group-hover/link:text-zinc-400 group-hover/link:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}

                          {res.official_resource && (
                            <a
                              href={res.official_resource}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-3 hover:bg-white border-b border-zinc-100 last:border-0 transition-colors group/link"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-zinc-900">Documentation</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">Official</span>
                                </div>
                                <p className="text-xs text-zinc-500 truncate group-hover/link:text-zinc-600 mt-0.5">
                                  Deep dive into concepts
                                </p>
                              </div>
                              <svg className="w-4 h-4 text-zinc-300 group-hover/link:text-zinc-400 group-hover/link:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}

                          {res.explore && (
                            <a
                              href={res.explore}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-3 hover:bg-white border-b border-zinc-100 last:border-0 transition-colors group/link"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-zinc-900">Explore</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">Daily.dev</span>
                                </div>
                                <p className="text-xs text-zinc-500 truncate group-hover/link:text-zinc-600 mt-0.5">
                                  Discover related content
                                </p>
                              </div>
                              <svg className="w-4 h-4 text-zinc-300 group-hover/link:text-zinc-400 group-hover/link:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
