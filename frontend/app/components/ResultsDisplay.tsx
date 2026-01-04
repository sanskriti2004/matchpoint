"use client";

interface MatchResult {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  ats_suggestions: string[];
  learning_resources: { skill: string; resource: string }[];
}

interface ResultsDisplayProps {
  results: MatchResult[] | null;
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  if (!results || results.length === 0) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="max-w-6xl mx-auto mt-12 space-y-8">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Match Analysis Results
      </h2>

      {results.length === 1 ? (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <SingleResult result={results[0]} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((result, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
            >
              <div className="text-center mb-4">
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(
                    result.match_score
                  )}`}
                >
                  {getScoreLabel(result.match_score)} - {result.match_score}%
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mt-2">
                  Job {index + 1}
                </h3>
              </div>
              <ComparisonResult result={result} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SingleResult({ result }: { result: MatchResult }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className={`inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold ${getScoreColor(
            result.match_score
          )}`}
        >
          {getScoreLabel(result.match_score)} Match - {result.match_score}%
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              Matching Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.matching_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
              Missing Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.missing_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              ATS Suggestions
            </h3>
            <ul className="space-y-2">
              {result.ats_suggestions.map((suggestion, idx) => (
                <li
                  key={idx}
                  className="text-blue-700 text-sm flex items-start gap-2"
                >
                  <span>•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
              Learning Resources
            </h3>
            <div className="space-y-2">
              {result.learning_resources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.resource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-purple-200 text-purple-800 px-3 py-2 rounded-lg text-sm hover:bg-purple-300 transition-colors"
                >
                  {resource.skill}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonResult({ result }: { result: MatchResult }) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium text-gray-700 mb-1">Matching Skills</h4>
        <div className="flex flex-wrap gap-1">
          {result.matching_skills.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
            >
              {skill}
            </span>
          ))}
          {result.matching_skills.length > 3 && (
            <span className="text-gray-500 text-xs">
              +{result.matching_skills.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-700 mb-1">Missing Skills</h4>
        <div className="flex flex-wrap gap-1">
          {result.missing_skills.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs"
            >
              {skill}
            </span>
          ))}
          {result.missing_skills.length > 3 && (
            <span className="text-gray-500 text-xs">
              +{result.missing_skills.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-700 mb-1">Top Suggestion</h4>
        <p className="text-sm text-gray-600">
          {result.ats_suggestions[0] || "No suggestions available"}
        </p>
      </div>
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 85) return "text-green-600 bg-green-100"; // Strong Match
  if (score >= 70) return "text-blue-600 bg-blue-100"; // Good Match
  if (score >= 50) return "text-yellow-600 bg-yellow-100"; // Moderate Match
  if (score >= 30) return "text-orange-600 bg-orange-100"; // Weak Match
  return "text-red-600 bg-red-100"; // Very Poor Match
}

function getScoreLabel(score: number) {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Weak";
  return "Very Poor";
}
