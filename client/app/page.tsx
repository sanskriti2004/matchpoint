import Link from "next/link";
import { ArrowRight, Sparkles, Target, FileText } from "lucide-react";

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, User
        </h1>
        <p className="text-slate-500 mt-2">
          Ready to land your dream job? Select a tool to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 text-indigo-600">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-bold mb-2">Resume Builder</h3>
          <p className="text-slate-500 text-sm mb-4">
            Create a professional resume from your GitHub profile or scratch.
          </p>
          <Link
            href="/builder"
            className="text-indigo-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          >
            Start Building <ArrowRight size={16} />
          </Link>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
            <Target size={24} />
          </div>
          <h3 className="text-lg font-bold mb-2">ATS Scanner</h3>
          <p className="text-slate-500 text-sm mb-4">
            Scan your resume against job descriptions to increase interview
            chances.
          </p>
          <Link
            href="/scanner"
            className="text-emerald-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          >
            Scan Now <ArrowRight size={16} />
          </Link>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-600">
            <Sparkles size={24} />
          </div>
          <h3 className="text-lg font-bold mb-2">Cover Letter AI</h3>
          <p className="text-slate-500 text-sm mb-4">
            Generate personalized cover letters instantly using advanced AI.
          </p>
          <Link
            href="/cover-letter"
            className="text-purple-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          >
            Generate <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
