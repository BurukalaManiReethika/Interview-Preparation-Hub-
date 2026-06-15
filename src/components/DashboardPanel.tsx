import React from "react";
import { 
  Sparkles, 
  Award, 
  Briefcase, 
  Code, 
  BookOpen, 
  FileText, 
  ArrowRight,
  ChevronRight,
  History
} from "lucide-react";

interface DashboardPanelProps {
  setActiveTab: (tab: string) => void;
  stats: {
    interviewsCount: number;
    avgInterviewScore: number;
    starStoriesCount: number;
    resumeReviewsCount: number;
    codeReviewsCount: number;
  };
}

export default function DashboardPanel({ setActiveTab, stats }: DashboardPanelProps) {
  const launchCards = [
    {
      id: "interview",
      title: "AI Mock Interviewer",
      desc: "Simulate pressure-filled interviews for real companies with real-time feedback and dynamic scoring.",
      icon: Briefcase,
      color: "from-blue-500 to-indigo-600",
      accent: "text-blue-600 bg-blue-50",
    },
    {
      id: "star",
      title: "STAR Behavioral Polisher",
      desc: "Structure your project anecdotes using the STAR method. Get scored and instantly rewritten by our AI coach.",
      icon: Award,
      color: "from-amber-500 to-orange-600",
      accent: "text-amber-600 bg-amber-50",
    },
    {
      id: "resume",
      title: "ATS Resume Feedback",
      desc: "Paste your resume and target role to scan for keywords, readability, and metric quantization formulas.",
      icon: FileText,
      color: "from-emerald-500 to-teal-600",
      accent: "text-emerald-600 bg-emerald-50",
    },
    {
      id: "technical",
      title: "Bespoke Learning Roadmaps",
      desc: "Synthesize target syllabus modules and custom high-frequency interview questions with optimized solutions.",
      icon: BookOpen,
      color: "from-purple-500 to-pink-600",
      accent: "text-purple-600 bg-purple-50",
    },
    {
      id: "code",
      title: "System & Code Auditor",
      desc: "Audit your coding answers for Big-O efficiency, correctness, and discover overlooked edge cases.",
      icon: Code,
      color: "from-rose-500 to-red-600",
      accent: "text-rose-600 bg-rose-50",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900 text-white p-8 md:p-10 shadow-lg border border-neutral-800">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Sparkles size={160} />
        </div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-amber-400 border border-neutral-700">
            <Sparkles size={12} className="animate-pulse" />
            AI-Engine Activated · Pro Engine
          </span>
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
            Elevate Your Interview Gameplay to Elite Status
          </h1>
          <p className="text-neutral-300 text-sm md:text-base leading-relaxed">
            Welcome to the ultimate hub for engineering and product interview mastery. Access specialized AI modules designed to turn raw experiences into pristine, job-winning deliveries.
          </p>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Mock Interviews</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-semibold text-neutral-900">{stats.interviewsCount}</span>
            <span className="text-xs text-neutral-400">sessions</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Avg Interview Score</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-semibold text-neutral-900">
              {stats.avgInterviewScore > 0 ? `${stats.avgInterviewScore}%` : "—"}
            </span>
            <span className="text-xs text-neutral-400">achievement</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">STAR Stories</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-semibold text-neutral-900">{stats.starStoriesCount}</span>
            <span className="text-xs text-neutral-400">polished</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Resume Reviews</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-semibold text-neutral-900">{stats.resumeReviewsCount}</span>
            <span className="text-xs text-neutral-400">scanned</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Code Audits</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-semibold text-neutral-900">{stats.codeReviewsCount}</span>
            <span className="text-xs text-neutral-400">optimized</span>
          </div>
        </div>
      </div>

      {/* Launcher Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-display font-semibold text-neutral-900 flex items-center gap-2">
          <span>Active Practice Pillars</span>
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {launchCards.map((card) => {
            const Icon = card.icon;
            return (
              <div 
                key={card.id}
                onClick={() => setActiveTab(card.id)}
                className="group relative flex gap-5 bg-white p-6 rounded-xl border border-neutral-200/80 shadow-xs hover:border-neutral-300 hover:shadow-md cursor-pointer transition-all duration-300 overflow-hidden"
              >
                <div className={`p-3 rounded-lg w-fit h-fit ${card.accent} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={24} />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-neutral-900 text-base md:text-lg flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                    {card.title}
                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs md:text-sm text-neutral-500 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
