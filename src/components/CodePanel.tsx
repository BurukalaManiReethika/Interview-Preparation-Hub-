import React, { useState, useEffect } from "react";
import { 
  Code, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Copy, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Terminal,
  FileCode,
  Bookmark
} from "lucide-react";
import { CodeEvaluationResult } from "../types";

const CODE_LANGUAGES = ["TypeScript", "JavaScript", "Python", "Go", "Java", "C++", "Rust", "SQL"];

const INITIAL_CODE_TEMPLATES = [
  {
    label: "Two Sum (Suboptimal)",
    lang: "TypeScript",
    problem: "Given an array of integers, return indices of the two numbers such that they add up to a specific target.",
    code: `function twoSum(nums: number[], target: number): number[] {
  // Brute force solution
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}`
  },
  {
    label: "SQL Nth Salary (Suboptimal)",
    lang: "SQL",
    problem: "Query the N-th highest payroll salary from an Employee table.",
    code: `SELECT Salary FROM Employee 
ORDER BY Salary DESC 
LIMIT 1 OFFSET N;`
  }
];

interface CodePanelProps {
  onCodeAudited: () => void;
}

export default function CodePanel({ onCodeAudited }: CodePanelProps) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState(CODE_LANGUAGES[0]);
  const [problemDescription, setProblemDescription] = useState("");
  
  const [activeReview, setActiveReview] = useState<CodeEvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Past evaluations
  const [pastAudits, setPastAudits] = useState<CodeEvaluationResult[]>([]);
  const [selectedPastAudit, setSelectedPastAudit] = useState<CodeEvaluationResult | null>(null);

  useEffect(() => {
    loadPastAudits();
  }, []);

  const loadPastAudits = () => {
    const raw = localStorage.getItem("prep_hub_code_reviews");
    if (raw) {
      try {
        setPastAudits(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleApplyTemplate = (tpl: typeof INITIAL_CODE_TEMPLATES[0]) => {
    setCode(tpl.code);
    setLanguage(tpl.lang);
    setProblemDescription(tpl.problem);
    setSelectedPastAudit(null);
  };

  const handleCopyCode = () => {
    const targetCode = selectedPastAudit ? selectedPastAudit.fixedCode : activeReview?.fixedCode || "";
    if (!targetCode) return;
    navigator.clipboard.writeText(targetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAuditCode = async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setSelectedPastAudit(null);

    try {
      const res = await fetch("/api/gemini/code-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, problemDescription })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to audit coding block");
      }

      const data = await res.json();
      const newReview: CodeEvaluationResult = {
        id: "code_" + Date.now(),
        code,
        language,
        problemDescription,
        correctness: data.correctness,
        performance: data.performance,
        edgeCases: data.edgeCases,
        fixedCode: data.fixedCode,
        explanation: data.explanation,
        timestamp: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      };

      setActiveReview(newReview);
      
      const updated = [newReview, ...pastAudits];
      localStorage.setItem("prep_hub_code_reviews", JSON.stringify(updated));
      setPastAudits(updated);
      onCodeAudited();
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during design analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setActiveReview(null);
    setSelectedPastAudit(null);
    setError(null);
  };

  const currentView = selectedPastAudit || activeReview;

  return (
    <div className="grid lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Code Draft Input Sidebar */}
      <div className="lg:col-span-5 space-y-6">
        
        <div className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-semibold text-neutral-900 flex items-center gap-2">
              <Code size={18} className="text-rose-500" />
              Code Console
            </h3>
            {(activeReview || selectedPastAudit) && (
              <button 
                onClick={handleReset}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="space-y-4">
            
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Quick Code Starter</label>
              <div className="flex gap-2">
                {INITIAL_CODE_TEMPLATES.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(t)}
                    className="text-[10px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Language</label>
                <select 
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {CODE_LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Target Problem (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. O(N) Two Sum, LRU Cache"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Source Code Codeblock</label>
              <textarea 
                rows={12}
                placeholder="Paste your software function algorithm or database sql query block down here..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none leading-relaxed"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button
              onClick={handleAuditCode}
              disabled={isLoading || !code.trim()}
              className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-250 text-white p-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Assembling Big-O Compiler...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Analyze Algorithm Quality
                </>
              )}
            </button>
          </div>
        </div>

        {/* Saved Audits list */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <Clock size={15} />
            Optimization history
          </h3>

          {pastAudits.length === 0 ? (
            <p className="text-xs text-neutral-400 py-3 text-center">No cached reviews found.</p>
          ) : (
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {pastAudits.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedPastAudit(item);
                    setActiveReview(null);
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedPastAudit?.id === item.id 
                      ? "bg-rose-50/50 border-rose-200" 
                      : "bg-white border-neutral-100 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">{item.language}</span>
                    <span className="text-[9px] text-neutral-400">{item.timestamp}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-800 line-clamp-1">
                    {item.problemDescription || "Snippet Evaluation"}
                  </h4>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Main displays console display */}
      <div className="lg:col-span-7 flex flex-col min-h-[500px]">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-xs flex items-center gap-3">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!currentView ? (
          <div className="flex-1 bg-neutral-50/50 rounded-2xl border-2 border-dashed border-neutral-200 p-12 flex flex-col items-center justify-center text-center space-y-5">
            <div className="p-4 bg-rose-50 text-rose-500 rounded-full">
              <Terminal size={40} />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-display font-semibold text-neutral-900">Virtual Code Auditor</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Analyze algorithmic logic instantly. Input your solution code block to isolate time & space complexities, unearth tricky boundary failures, and obtain a copy-pasteable fully optimized code alternative.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-6 space-y-6 animate-fade-in flex-1">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                  <Terminal size={12} /> Algorithmic evaluation verdict
                </span>
                <h3 className="text-lg font-semibold text-neutral-800 line-clamp-1">
                  {currentView.problemDescription || "Custom Snippet Review"}
                </h3>
                <p className="text-xs text-neutral-400">Language evaluated: {currentView.language}</p>
              </div>
            </div>

            {/* Complexities Tag cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Correctness Audit</span>
                <p className="text-xs text-neutral-700 leading-relaxed font-semibold">
                  {currentView.correctness}
                </p>
              </div>

              <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Big-O Complexities</span>
                <p className="text-xs text-indigo-700 leading-relaxed font-bold font-mono">
                  {currentView.performance}
                </p>
              </div>
            </div>

            {/* Algorithmic explainer block */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Architect feedback</h4>
              <p className="text-xs md:text-sm text-neutral-600 leading-relaxed bg-neutral-50 py-3.5 px-4 rounded-xl border border-neutral-100">
                {currentView.explanation}
              </p>
            </div>

            {/* Overlooked Boundary / Edgecases list */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Tricky Bound-Failure Points</h4>
              <p className="text-xs text-neutral-600 leading-relaxed bg-red-50/25 border border-red-100 p-4 rounded-xl">
                {currentView.edgeCases}
              </p>
            </div>

            {/* pristine optimized solution */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-550 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-rose-500 animate-pulse" />
                  Pristine Optimized Solution Codeblock
                </h4>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95 bg-white shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              <div className="bg-neutral-950 text-neutral-200 p-5 rounded-xl text-xs md:text-sm leading-relaxed overflow-x-auto border border-neutral-900 shadow-xl max-h-[350px]">
                <pre className="font-mono whitespace-pre">{currentView.fixedCode}</pre>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
