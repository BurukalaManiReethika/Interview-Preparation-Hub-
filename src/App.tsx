/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  Award, 
  FileText, 
  BookOpen, 
  Code, 
  Sparkles, 
  TrendingUp, 
  History, 
  Menu, 
  X,
  User,
  Fingerprint,
  PieChart
} from "lucide-react";

// Components
import DashboardPanel from "./components/DashboardPanel";
import InterviewPanel from "./components/InterviewPanel";
import StarPanel from "./components/StarPanel";
import ResumePanel from "./components/ResumePanel";
import TechnicalPanel from "./components/TechnicalPanel";
import CodePanel from "./components/CodePanel";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [stats, setStats] = useState({
    interviewsCount: 0,
    avgInterviewScore: 0,
    starStoriesCount: 0,
    resumeReviewsCount: 0,
    codeReviewsCount: 0
  });

  useEffect(() => {
    calculateStats();
  }, []);

  const calculateStats = () => {
    let interviewsCount = 0;
    let avgInterviewScore = 0;
    let starStoriesCount = 0;
    let resumeReviewsCount = 0;
    let codeReviewsCount = 0;

    const intRaw = localStorage.getItem("prep_hub_interviews");
    if (intRaw) {
      try {
        const parsed = JSON.parse(intRaw);
        interviewsCount = parsed.length;
        const completed = parsed.filter((x: any) => x.isFinished && x.feedback);
        if (completed.length > 0) {
          const sum = completed.reduce((acc: number, cur: any) => acc + (cur.feedback.score || 0), 0);
          avgInterviewScore = Math.round(sum / completed.length);
        }
      } catch (e) {
        console.error(e);
      }
    }

    const starRaw = localStorage.getItem("prep_hub_star_stories");
    if (starRaw) {
      try {
        starStoriesCount = JSON.parse(starRaw).length;
      } catch (e) {
        console.error(e);
      }
    }

    const resumeRaw = localStorage.getItem("prep_hub_resumes");
    if (resumeRaw) {
      try {
        resumeReviewsCount = JSON.parse(resumeRaw).length;
      } catch (e) {
        console.error(e);
      }
    }

    const codeRaw = localStorage.getItem("prep_hub_code_reviews");
    if (codeRaw) {
      try {
        codeReviewsCount = JSON.parse(codeRaw).length;
      } catch (e) {
        console.error(e);
      }
    }

    setStats({
      interviewsCount,
      avgInterviewScore,
      starStoriesCount,
      resumeReviewsCount,
      codeReviewsCount
    });
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard Overview", icon: PieChart },
    { id: "interview", label: "Mock Interviewer", icon: Briefcase },
    { id: "star", label: "STAR Story Coach", icon: Award },
    { id: "resume", label: "ATS Resume Feedback", icon: FileText },
    { id: "technical", label: "Syllabus Roadmaps", icon: BookOpen },
    { id: "code", label: "Coding Auditor", icon: Code }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Top Banner Navigation bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200/80 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="p-2 bg-indigo-600 text-white rounded-lg">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <span className="font-display font-bold text-neutral-900 text-lg tracking-tight">
              Interview Preparation Hub <span className="text-indigo-600">Pro</span>
            </span>
          </div>
        </div>

        {/* User Context */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
            <Fingerprint size={12} />
            manireethikab@gmail.com
          </span>
          <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 flex items-center justify-center cursor-pointer transition-colors" title="Account Details">
            <User size={16} />
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* Left Side Sidebar - desktop */}
        <aside className="hidden md:block w-64 bg-white border-r border-neutral-200/80 p-4 space-y-2 shrink-0">
          <span className="block px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Core Modules</span>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    activeTab === item.id 
                      ? "bg-indigo-50 text-indigo-700" 
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile menu container overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-xs flex">
            <div className="w-64 bg-white p-4 space-y-4 shadow-xl flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-150">
                <span className="font-bold text-neutral-800 text-sm">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-neutral-500 cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <nav className="space-y-1 flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === item.id 
                          ? "bg-indigo-50 text-indigo-700" 
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="block text-[9px] font-bold text-neutral-400 uppercase">Profile context</span>
                <span className="block text-[11px] text-neutral-700 font-medium truncate mt-1">manireethikab@gmail.com</span>
              </div>
            </div>
          </div>
        )}

        {/* Central main action area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === "dashboard" && (
            <DashboardPanel setActiveTab={setActiveTab} stats={stats} />
          )}

          {activeTab === "interview" && (
            <InterviewPanel onSessionCreated={calculateStats} />
          )}

          {activeTab === "star" && (
            <StarPanel onStoryPolished={calculateStats} />
          )}

          {activeTab === "resume" && (
            <ResumePanel onResumeScanned={calculateStats} />
          )}

          {activeTab === "technical" && (
            <TechnicalPanel onRoadmapGenerated={calculateStats} />
          )}

          {activeTab === "code" && (
            <CodePanel onCodeAudited={calculateStats} />
          )}
        </main>
      </div>

      {/* Footer footer */}
      <footer className="bg-white border-t border-neutral-200/80 p-4 text-center text-xs text-neutral-400">
        © 2026 Interview Preparation Hub Pro · Empowered by Professional AI & Express.
      </footer>
    </div>
  );
}
