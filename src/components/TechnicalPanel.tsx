import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Star, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  RefreshCw, 
  Plus, 
  AlertCircle,
  HelpCircle,
  Zap,
  Bookmark
} from "lucide-react";
import { TechPackage, TechQuestion } from "../types";

const DOMAIN_PRESETS = [
  "Frontend Architecture (React, Performance, Rendering)",
  "Distributed Systems & Backend Design (Scaling, Caching, DBs)",
  "SRE, Cloud, & Infrastructure (Kubernetes, DNS, IAM, CI/CD)",
  "Data Engineering (Pipelines, Warehouse, Spark, Kafka)",
  "Mobile Engineering (iOS / Android Performance, Native, Hybrid)",
  "Machine Learning & AI Engineering (Inference, Vectors, Tuning)"
];

const SENIORITY_PRESETS = [
  "Junior (0-2 Yrs XP)",
  "Mid-Level (2-5 Yrs XP)",
  "Senior / Lead (5+ Yrs XP)"
];

interface TechnicalPanelProps {
  onRoadmapGenerated: () => void;
}

export default function TechnicalPanel({ onRoadmapGenerated }: TechnicalPanelProps) {
  const [field, setField] = useState(DOMAIN_PRESETS[0]);
  const [level, setLevel] = useState(SENIORITY_PRESETS[1]);
  
  const [activePackage, setActivePackage] = useState<TechPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bookmarking question IDs
  const [starredQuestionIds, setStarredQuestionIds] = useState<string[]>([]);
  // Completed question IDs
  const [completedQuestionIds, setCompletedQuestionIds] = useState<string[]>([]);

  // Expanded QA index
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Past syllabus caches
  const [savedPackages, setSavedPackages] = useState<TechPackage[]>([]);
  const [selectedPastPackage, setSelectedPastPackage] = useState<TechPackage | null>(null);

  useEffect(() => {
    loadSavedPackages();
    // Load question progress
    const starredRaw = localStorage.getItem("prep_hub_starred_questions");
    const completedRaw = localStorage.getItem("prep_hub_completed_questions");
    if (starredRaw) setStarredQuestionIds(JSON.parse(starredRaw));
    if (completedRaw) setCompletedQuestionIds(JSON.parse(completedRaw));
  }, []);

  const loadSavedPackages = () => {
    const raw = localStorage.getItem("prep_hub_roadmaps");
    if (raw) {
      try {
        setSavedPackages(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (starredQuestionIds.includes(id)) {
      updated = starredQuestionIds.filter(x => x !== id);
    } else {
      updated = [...starredQuestionIds, id];
    }
    setStarredQuestionIds(updated);
    localStorage.setItem("prep_hub_starred_questions", JSON.stringify(updated));
  };

  const toggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (completedQuestionIds.includes(id)) {
      updated = completedQuestionIds.filter(x => x !== id);
    } else {
      updated = [...completedQuestionIds, id];
    }
    setCompletedQuestionIds(updated);
    localStorage.setItem("prep_hub_completed_questions", JSON.stringify(updated));
  };

  const handleGenerateRoadmap = async () => {
    setIsLoading(true);
    setError(null);
    setSelectedPastPackage(null);

    try {
      const res = await fetch("/api/gemini/technical-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, level })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate learning path");
      }

      const data = await res.json();
      const newPackage: TechPackage = {
        field,
        level,
        roadmapSteps: data.roadmapSteps,
        questions: data.questions,
        timestamp: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      };

      setActivePackage(newPackage);
      setExpandedQuestionId(null);

      const updated = [newPackage, ...savedPackages];
      localStorage.setItem("prep_hub_roadmaps", JSON.stringify(updated));
      setSavedPackages(updated);
      onRoadmapGenerated();
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during dynamic generation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setActivePackage(null);
    setSelectedPastPackage(null);
    setError(null);
    setExpandedQuestionId(null);
  };

  const currentView = selectedPastPackage || activePackage;

  return (
    <div className="grid lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Configuration Inputs */}
      <div className="lg:col-span-4 space-y-6">
        
        <div className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-semibold text-neutral-900 flex items-center gap-2">
              <BookOpen size={18} className="text-purple-500" />
              Syllabus Generator
            </h3>
            {(activePackage || selectedPastPackage) && (
              <button 
                onClick={handleReset}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Technical Subject</label>
              <select 
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                value={field}
                onChange={(e) => setField(e.target.value)}
              >
                {DOMAIN_PRESETS.map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Target Seniority / Depth</label>
              <select 
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                {SENIORITY_PRESETS.map((l, idx) => (
                  <option key={idx} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerateRoadmap}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-350 text-white p-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Synthesizing Roadmap...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Assemble Custom Roadmap
                </>
              )}
            </button>
          </div>
        </div>

        {/* Saved Study Roadmaps Sidebar */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <Bookmark size={15} />
            Study Collections
          </h3>

          {savedPackages.length === 0 ? (
            <p className="text-xs text-neutral-400 py-3 text-center">No subjects mapped yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {savedPackages.map((pkg, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedPastPackage(pkg);
                    setActivePackage(null);
                    setExpandedQuestionId(null);
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedPastPackage?.field === pkg.field && selectedPastPackage?.level === pkg.level
                      ? "bg-purple-50/50 border-purple-200" 
                      : "bg-white border-neutral-100 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">{pkg.level.split(" ")[0]}</span>
                    <span className="text-[9px] text-neutral-400">{pkg.timestamp}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-800 line-clamp-2">{pkg.field.split(" (")[0]}</h4>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Main Roadmap Display Stage */}
      <div className="lg:col-span-8 flex flex-col min-h-[500px]">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-xs flex items-center gap-3">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!currentView ? (
          <div className="flex-1 bg-neutral-50/50 rounded-2xl border-2 border-dashed border-neutral-200 p-12 flex flex-col items-center justify-center text-center space-y-5">
            <div className="p-4 bg-purple-50 text-purple-500 rounded-full">
              <BookOpen size={40} />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-display font-semibold text-neutral-900">Adaptive Roadmap Hub</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Unlock structured technical roadmaps coupled with professional flashcard questions. Map any focus domain to study complete design templates, code blocks, and model mock answers.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in flex-1 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
            
            {/* Header Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                  <Zap size={11} /> Learning Roadmaps Synthesizer
                </span>
                <h3 className="text-lg font-semibold text-neutral-800">
                  {currentView.field}
                </h3>
                <p className="text-xs text-neutral-400">Experience scope preset: {currentView.level}</p>
              </div>
            </div>

            {/* Visual Roadmap Path */}
            <div className="space-y-5">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Syllabus Milestones</h4>
              
              <div className="grid md:grid-cols-5 gap-4 relative">
                {currentView.roadmapSteps.map((step, idx) => (
                  <div key={idx} className="relative bg-neutral-50 p-4 rounded-xl border border-neutral-150 flex flex-col justify-start space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-purple-600 text-white font-display text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Phase 0{idx + 1}</span>
                    </div>
                    <h5 className="text-xs font-bold text-neutral-800 leading-snug">{step.title}</h5>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Flashcard Questions */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Curated Flashcard Modules</h4>
              
              <div className="space-y-3">
                {currentView.questions.map((q, idx) => {
                  const isExpanded = expandedQuestionId === q.id;
                  const isStarred = starredQuestionIds.includes(q.id);
                  const isCompleted = completedQuestionIds.includes(q.id);

                  return (
                    <div 
                      key={q.id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isExpanded 
                          ? "border-purple-200 bg-purple-50/10" 
                          : "border-neutral-100 hover:border-neutral-200 bg-white"
                      }`}
                    >
                      {/* Accordion Trigger Header */}
                      <div 
                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => toggleComplete(q.id, e)}
                            className={`p-1 rounded-full border transition-colors ${
                              isCompleted 
                                ? "bg-purple-100 border-purple-350 text-purple-600" 
                                : "hover:bg-neutral-100 border-neutral-200 text-neutral-300"
                            }`}
                            title={isCompleted ? "Mark as Not Learned" : "Mark as Learned"}
                          >
                            <Check size={14} />
                          </button>
                          
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase">Flashcard 0{idx + 1}</span>
                            <h5 className={`text-xs md:text-sm font-semibold transition-colors ${
                              isCompleted ? "text-neutral-400 line-through font-normal" : "text-neutral-800"
                            }`}>
                              {q.question}
                            </h5>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => toggleStar(q.id, e)}
                            className={`p-1.5 rounded transition-all ${
                              isStarred 
                                ? "text-amber-500 scale-110" 
                                : "text-neutral-300 hover:text-neutral-500"
                            }`}
                            title={isStarred ? "Starred question" : "Star question"}
                          >
                            <Star size={15} fill={isStarred ? "currentColor" : "none"} />
                          </button>
                          
                          {isExpanded ? <ChevronDown size={16} className="text-neutral-400" /> : <ChevronRight size={16} className="text-neutral-400" />}
                        </div>
                      </div>

                      {/* Accordion Content Body */}
                      {isExpanded && (
                        <div className="p-5 border-t border-purple-100 bg-white text-xs md:text-sm text-neutral-700 leading-relaxed space-y-3 whitespace-pre-wrap">
                          <div className="font-semibold text-purple-700 uppercase tracking-wide text-[10px] mb-1">Model Expert Solution</div>
                          {q.sampleAnswer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
