"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, ScanSearch, PenTool } from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "Resume Builder", icon: FileText, href: "/builder" },
  { name: "ATS Scanner", icon: ScanSearch, href: "/scanner" },
  { name: "Cover Letter", icon: PenTool, href: "/cover-letter" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto border-r border-slate-800 hidden md:block">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-indigo-400">
          JobSuit<span className="text-white">.clone</span>
        </h1>
        <p className="text-slate-500 text-xs mt-1">AI Career Assistant</p>
      </div>

      <nav className="mt-6 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon
                size={20}
                className={
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-white"
                }
              />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
