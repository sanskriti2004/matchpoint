"use client";

interface MatchResult {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  ats_suggestions: string[];
  learning_resources: { skill: string; resource: string }[];
}

interface ResultsDisplayProps {
  result: MatchResult | null;
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  if (!result) return null;

  const score = result.match_score;
  const getProgressColor = () => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="mt-20 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
          Match Analysis
        </span>
        <div className="flex flex-col items-center">
          <span
            className={`text-7xl font-light tracking-tighter ${
              score >= 80 ? "text-zinc-900" : "text-zinc-700"
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
            <div className="grid grid-cols-1 gap-2">
              {result.learning_resources.map((res, i) => (
                <a
                  key={i}
                  href={res.resource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                >
                  <span className="text-sm font-medium text-zinc-700 group-hover:text-indigo-700 transition-colors">
                    {res.skill}
                  </span>
                  <svg
                    className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
