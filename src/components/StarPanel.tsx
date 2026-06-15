import React, { useState, useEffect } from "react";
import { 
  Award, 
  Sparkles, 
  ArrowRight, 
  Copy, 
  Check, 
  Calendar, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  RefreshCw,
  Plus
} from "lucide-react";
import { STARStoryAnalysis } from "../types";

const STACK_BEHAVIORAL_PRESETS = [
  {
    label: "Handling Technical Conflict Resolving",
    question: "Tell me about a time when you had a deep disagreement with another engineer concerning a system architecture option. How did you resolve it?"
  },
  {
    label: "Overcoming Critical Production Error",
    question: "Describe a critical system outage or bug you introduced. What actions did you take to mitigate the immediate impact, and what long-term preventive measures did you institute?"
  },
  {
    label: "Navigating Tight Project Deadline",
    question: "Tell me about a time you faced an extremely tight runway deadline with incomplete features. How did you scope and negotiate delivery?"
  },
  {
    label: "Dealing with Direct Criticisms",
    question: "Give an example of a time you received difficult constructive feedback from your peers or manager during a review cycle. How did you digest it?"
  },
  {
    label: "Leading a Highly Ambiguous Initiative",
    question: "Describe a complex technical task where requirements were highly undefined or changing rapidly. How did you establish focus?"
  }
];

interface StarPanelProps {
  onStoryPolished: () => void;
}

export default function StarPanel({ onStoryPolished }: StarPanelProps) {
  const [selectedPreset, setSelectedPreset] = useState("");
  const [promptQuestion, setPromptQuestion] = useState(STACK_BEHAVIORAL_PRESETS[0].question);
  const [storyText, setStoryText] = useState("");
  const [activeStory, setActiveStory] = useState<STARStoryAnalysis | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Past histories
  const [savedStories, setSavedStories] = useState<STARStoryAnalysis[]>([]);
  const [viewingSavedStory, setViewingSavedStory] = useState<STARStoryAnalysis | null>(null);

  useEffect(() => {
    loadSavedStories();
  }, []);

  const loadSavedStories = () => {
    const raw = localStorage.getItem("prep_hub_star_stories");
    if (raw) {
      try {
        setSavedStories(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCopy = () => {
    const textToCopy = viewingSavedStory 
      ? viewingSavedStory.idealRewrite 
      : activeStory?.idealRewrite || "";
    
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePresetSelect = (question: string) => {
    setPromptQuestion(question);
    setViewingSavedStory(null);
  };

  const handleEvaluateSTAR = async () => {
    if (!storyText.trim()) return;

    setIsLoading(true);
    setError(null);
    setViewingSavedStory(null);

    try {
      const res = await fetch("/api/gemini/behavioral-STAR", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyText, promptQuestion })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to process behavioral evaluation");
      }

      const data = await res.json();
      const polishedResult: STARStoryAnalysis = {
        id: "star_" + Date.now(),
        promptQuestion,
        storyText,
        parsed: data.parsed,
        scores: data.scores,
        overallScore: data.overallScore,
        improvementTips: data.improvementTips,
        idealRewrite: data.idealRewrite,
        timestamp: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      };

      setActiveStory(polishedResult);
      
      const updatedStories = [polishedResult, ...savedStories];
      localStorage.setItem("prep_hub_star_stories", JSON.stringify(updatedStories));
      setSavedStories(updatedStories);
      onStoryPolished(); // trigger stats recalc
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during behavioral polishing.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewStory = () => {
    setActiveStory(null);
    setViewingSavedStory(null);
    setStoryText("");
    setError(null);
  };

  const currentView = viewingSavedStory || activeStory;

  return (
    <div className="grid lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Configuration & Inputs form sidebar */}
      <div className="lg:col-span-5 space-y-6">
        
        <div className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-semibold text-neutral-900 flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              STAR Workshop
            </h3>
            {(activeStory || viewingSavedStory) && (
              <button 
                onClick={handleNewStory}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> New Story
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">High-impact Prompts</label>
              <div className="flex flex-wrap gap-2">
                {STACK_BEHAVIORAL_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(p.question)}
                    className={`px-3 py-1.5 rounded-full text-xs text-left font-medium border transition-colors cursor-pointer ${
                      promptQuestion === p.question
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Target Interview Question</label>
              <input 
                type="text"
                className="w-full bg-neutral-100 border border-neutral-200 rounded-lg p-2.5 text-xs text-neutral-700 focus:outline-none"
                value={promptQuestion}
                onChange={(e) => setPromptQuestion(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Your Draft Experience</label>
              <textarea 
                rows={10}
                placeholder="Draft your story here freely. Share details, describe what you (and not just your team) did, and state the final metric or product results. Do not worry about structure, we will organize it neatly into STAR phases!"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none"
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button
              onClick={handleEvaluateSTAR}
              disabled={isLoading || !storyText.trim()}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-white p-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Aligning Story Vectors...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Analyze & Polish with STAR
                </>
              )}
            </button>
          </div>
        </div>

        {/* Saved Stories Board */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <Clock size={15} />
            Polished Portfolio
          </h3>

          {savedStories.length === 0 ? (
            <p className="text-xs text-neutral-400 py-3 text-center">No portfolio elements stored yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {savedStories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => {
                    setViewingSavedStory(story);
                    setActiveStory(null);
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    viewingSavedStory?.id === story.id 
                      ? "bg-amber-50/50 border-amber-200" 
                      : "bg-white border-neutral-100 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Score: {story.overallScore}/100</span>
                    <span className="text-[9px] text-neutral-400 flex items-center gap-1">
                      <Calendar size={9} />
                      {story.timestamp}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-800 line-clamp-1">{story.promptQuestion}</h4>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Main assessment and rewrite stage */}
      <div className="lg:col-span-7 flex flex-col min-h-[500px]">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-xs flex items-center gap-3">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!currentView ? (
          <div className="flex-1 bg-neutral-50/50 rounded-2xl border-2 border-dashed border-neutral-200 p-12 flex flex-col items-center justify-center text-center space-y-5">
            <div className="p-4 bg-amber-50 text-amber-500 rounded-full">
              <Award size={40} />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-display font-semibold text-neutral-900">STAR Behavioral Coach</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                In top technology interviews (like Google, Amazon, Meta), behavioral answers must follow the **STAR** breakdown. Paste your experience draft on the left to structure, score, identify missing components, and read a beautiful, perfectly formatted copy-pasteable rewrite.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-6 space-y-6 animate-fade-in flex-1">
            
            {/* Split score headers */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Behavioral Analysis Report</span>
                <h3 className="text-lg font-semibold text-neutral-800 line-clamp-1">
                  {currentView.promptQuestion}
                </h3>
              </div>

              <div className="bg-amber-500 text-white px-4 py-2.5 rounded-xl border border-amber-600/10 flex items-center gap-2">
                <span className="text-xl font-display font-extrabold">{currentView.overallScore}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-100">Overall Rating</span>
              </div>
            </div>

            {/* Individual bar breakdowns */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">STAR Vector Ratings</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-semibold text-neutral-600">Situation</span>
                    <span className="text-[11px] font-bold text-neutral-800">{currentView.scores.situation}/10</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${currentView.scores.situation * 10}%` }}></div>
                  </div>
                </div>

                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-semibold text-neutral-600">Task</span>
                    <span className="text-[11px] font-bold text-neutral-800">{currentView.scores.task}/10</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${currentView.scores.task * 10}%` }}></div>
                  </div>
                </div>

                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-semibold text-neutral-600">Action</span>
                    <span className="text-[11px] font-bold text-neutral-800">{currentView.scores.action}/10</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${currentView.scores.action * 10}%` }}></div>
                  </div>
                </div>

                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-semibold text-neutral-600">Result</span>
                    <span className="text-[11px] font-bold text-neutral-800">{currentView.scores.result}/10</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${currentView.scores.result * 10}%` }}></div>
                  </div>
                </div>

              </div>
            </div>

            {/* Categorized Parsed Segments */}
            <div className="space-y-3 bg-neutral-50/50 p-4 rounded-xl border border-neutral-150">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Extracted Segments</h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-neutral-700">📌 Situation (Context setting)</span>
                  <p className="text-xs text-neutral-600 leading-relaxed bg-white p-3 rounded-lg border border-neutral-100">{currentView.parsed.situation}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-neutral-700">🎯 Task (The scope of work)</span>
                  <p className="text-xs text-neutral-600 leading-relaxed bg-white p-3 rounded-lg border border-neutral-100">{currentView.parsed.task}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-neutral-700">⚡ Action (Your individual deeds)</span>
                  <p className="text-xs text-neutral-600 leading-relaxed bg-white p-3 rounded-lg border border-neutral-100">{currentView.parsed.action}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-neutral-700">🎉 Result (Metrics & Outcomes)</span>
                  <p className="text-xs text-neutral-600 leading-relaxed bg-white p-3 rounded-lg border border-neutral-100">{currentView.parsed.result}</p>
                </div>
              </div>
            </div>

            {/* Improvement checklist items */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Coach Gaps & Feedback</h4>
              <div className="bg-red-50/30 border border-red-100 p-4 rounded-xl space-y-2">
                {currentView.improvementTips.map((tip, idx) => (
                  <div key={idx} className="flex gap-2 text-xs text-neutral-700 items-start">
                    <span className="text-red-500 font-bold mt-0.5 shrink-0">!</span>
                    <span className="leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ideal AI Copy-pasteable Rewrite section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500 animate-pulse" />
                  Optimal AI-Composed Rewrite
                </h4>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copy Rewrite
                    </>
                  )}
                </button>
              </div>

              <div className="bg-neutral-950 text-neutral-200 p-5 rounded-xl text-xs md:text-sm leading-relaxed font-sans border border-neutral-900 whitespace-pre-wrap">
                {currentView.idealRewrite}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
