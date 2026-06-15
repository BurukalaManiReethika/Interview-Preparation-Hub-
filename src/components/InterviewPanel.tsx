import React, { useState, useEffect, useRef } from "react";
import { 
  Briefcase, 
  Building, 
  Send, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  TrendingUp, 
  Mic, 
  MicOff, 
  AlertCircle,
  Award,
  ChevronRight,
  BookOpen,
  ArrowRight,
  UserCheck,
  Calendar
} from "lucide-react";
import { MockInterviewSession, InterviewMessage } from "../types";

const PRESET_ROLES = [
  "Frontend Engineer",
  "Backend Architect",
  "Fullstack Developer",
  "DevOps/SRE Specialist",
  "AI/ML Engineer",
  "Product Manager",
  "Data Analyst"
];

const PRESET_LEVELS = [
  "Junior (0-2 Years XP)",
  "Mid-Level (2-5 Years XP)",
  "Senior (5-8 Years XP)",
  "Staff / Principal Engineer"
];

interface InterviewPanelProps {
  onSessionCreated: () => void;
}

export default function InterviewPanel({ onSessionCreated }: InterviewPanelProps) {
  // Config state
  const [role, setRole] = useState(PRESET_ROLES[0]);
  const [company, setCompany] = useState("");
  const [level, setLevel] = useState(PRESET_LEVELS[1]);
  const [description, setDescription] = useState("");
  const [totalQuestions] = useState(5);

  // Active interview state
  const [activeSession, setActiveSession] = useState<MockInterviewSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(1);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Past sessions list (only finalized)
  const [pastSessions, setPastSessions] = useState<MockInterviewSession[]>([]);
  const [selectedPastSession, setSelectedPastSession] = useState<MockInterviewSession | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPastSessions();
    
    // Check Speech Recognition capability
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      
      rec.onresult = (event: any) => {
        let finalTrans = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript + " ";
          }
        }
        if (finalTrans) {
          setUserInput(prev => prev + finalTrans);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.history, isLoading]);

  const loadPastSessions = () => {
    const raw = localStorage.getItem("prep_hub_interviews");
    if (raw) {
      try {
        setPastSessions(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleStartInterview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gemini/mock-interview-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, company, level, description })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to initiate AI session");
      }

      const data = await res.json();
      const newSession: MockInterviewSession = {
        id: "int_" + Date.now(),
        role,
        company: company || "Standard Company",
        level,
        timestamp: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        history: data.history,
        isFinished: false
      };

      setActiveSession(newSession);
      setCurrentQuestionIndex(1);
      setUserInput("");
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResponse = async () => {
    if (!userInput.trim() || !activeSession) return;

    // Stop recording first
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const tempCandidateText = userInput.trim();
    setUserInput("");
    setIsLoading(true);
    setError(null);

    // optimistically update candidate bubble
    const nextHistory: InterviewMessage[] = [
      ...activeSession.history,
      { role: "candidate", text: tempCandidateText }
    ];
    setActiveSession({
      ...activeSession,
      history: nextHistory
    });

    try {
      const res = await fetch("/api/gemini/mock-interview-respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: activeSession.role,
          company: activeSession.company,
          level: activeSession.level,
          history: activeSession.history, // send previous history (without the candidate's optimized answer, backend appends)
          userInput: tempCandidateText,
          currentQuestionIndex,
          totalQuestions
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to process interview message");
      }

      const data = await res.json();
      
      if (data.isFinished) {
        // High fidelity final assessment
        const finishedSession: MockInterviewSession = {
          ...activeSession,
          history: data.history,
          isFinished: true,
          feedback: data.feedback
        };
        setActiveSession(finishedSession);
        
        // Save to persistent storage
        const updatedSessions = [finishedSession, ...pastSessions];
        localStorage.setItem("prep_hub_interviews", JSON.stringify(updatedSessions));
        setPastSessions(updatedSessions);
        onSessionCreated(); // notify parent stat recalculators
      } else {
        // Advance question
        setActiveSession({
          ...activeSession,
          history: data.history
        });
        setCurrentQuestionIndex(prev => prev + 1);
      }
    } catch (e: any) {
      setError(e.message || "An error occurred during communication.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setActiveSession(null);
    setSelectedPastSession(null);
    setError(null);
    setUserInput("");
    setIsListening(false);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Session Controls / Past History Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        
        {!activeSession && !selectedPastSession ? (
          <div className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-xs space-y-5">
            <h3 className="text-lg font-display font-semibold text-neutral-900 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              Configure Live Session
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Target Title / Role</label>
                <select 
                  className="w-full bg-neutral-50 select-none border border-neutral-200 rounded-lg p-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {PRESET_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Target Company (Optional)</label>
                <div className="relative">
                  <Building size={16} className="absolute left-3 top-3 text-neutral-400" />
                  <input 
                    type="text"
                    placeholder="e.g. Google, Stripe, Netflix"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 pl-10 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Experience Level</label>
                <select 
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  {PRESET_LEVELS.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Focus context / Background (Optional)</label>
                <textarea 
                  rows={3}
                  placeholder="Paste core tech stack, favorite projects, or parts of your CV to shape custom behavioral questions."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button 
                onClick={handleStartInterview}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Assembling AI Board...
                  </>
                ) : (
                  <>
                    <TrendingUp size={16} />
                    Begin AI Board Assessment
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Active Session Details</h3>
            <div className="p-4 bg-neutral-50 rounded-lg space-y-3.5 border border-neutral-100">
              <div className="flex items-start gap-3">
                <Briefcase size={16} className="mt-0.5 text-indigo-500" />
                <div>
                  <h4 className="text-sm font-semibold text-neutral-800">{activeSession?.role || selectedPastSession?.role}</h4>
                  <p className="text-xs text-neutral-500">{activeSession?.level || selectedPastSession?.level}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building size={16} className="text-neutral-500" />
                <span className="text-xs font-medium text-neutral-700">{activeSession?.company || selectedPastSession?.company}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-neutral-400" />
                <span className="text-xs text-neutral-500">{activeSession?.timestamp || selectedPastSession?.timestamp}</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              Back to Configuration
            </button>
          </div>
        )}

        {/* Historic Sessions Board */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <Clock size={15} />
            Completed Evaluations
          </h3>

          {pastSessions.length === 0 ? (
            <p className="text-xs text-neutral-400 py-4 text-center">No completed interviews yet.</p>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {pastSessions.map((s) => (
                <div 
                  key={s.id}
                  onClick={() => {
                    setSelectedPastSession(s);
                    setActiveSession(null);
                  }}
                  className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedPastSession?.id === s.id 
                      ? "bg-indigo-50/50 border-indigo-200 shadow-xs" 
                      : "bg-white border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-indigo-600">{s.company}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700">
                      Score: {s.feedback?.score}%
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-800 line-clamp-1">{s.role}</h4>
                  <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                    <Calendar size={10} />
                    {s.timestamp.split(",")[0]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Main Dialogue Panel / Results Stage */}
      <div className="lg:col-span-8 flex flex-col min-h-[500px]">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-xs flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. STATE: IDLE CONFIGURATION */}
        {!activeSession && !selectedPastSession && (
          <div className="flex-1 bg-neutral-50/50 rounded-2xl border-2 border-dashed border-neutral-200 p-12 flex flex-col items-center justify-center text-center space-y-5">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full">
              <Briefcase size={40} />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-display font-semibold text-neutral-900">Virtual Interview Room</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Configure your target parameters in the sidebar to start. The AI simulates sequential questions appropriate for your seniority, followed by real-time scorecard evaluations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-sm w-full text-xs text-neutral-600 pt-2">
              <div className="bg-white p-3 rounded-lg border border-neutral-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                <span>Tailored Questions</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-neutral-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Copious Analytics</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. STATE: LIVE ONGOING INTERVIEW */}
        {activeSession && !activeSession.isFinished && (
          <div className="flex-1 bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Live Board Dialogue</span>
              </div>
              <div className="text-xs font-bold text-neutral-500">
                Question <span className="text-indigo-600 font-display">{currentQuestionIndex}</span> of {totalQuestions}
              </div>
            </div>

            {/* Chat Box */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 max-h-[380px]">
              {activeSession.history.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex gap-4 ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role !== "candidate" && (
                    <div className="h-8 w-8 rounded-full bg-neutral-900 text-amber-400 font-semibold text-[10px] flex items-center justify-center shrink-0 border border-neutral-800">
                      AI
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-xl p-4 text-sm leading-relaxed ${
                    msg.role === "candidate"
                      ? "bg-neutral-100 text-neutral-900 rounded-tr-none"
                      : "bg-neutral-50 border border-neutral-100 text-neutral-800 rounded-tl-none whitespace-pre-wrap"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="h-8 w-8 rounded-full bg-neutral-900 text-amber-400 font-semibold text-[10px] flex items-center justify-center shrink-0 border border-neutral-800">
                    AI
                  </div>
                  <div className="bg-neutral-100 rounded-xl p-4 text-xs font-medium text-neutral-500 flex items-center gap-2 rounded-tl-none animate-pulse">
                    <RefreshCw size={12} className="animate-spin" />
                    Interviewer is evaluating your response...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Footer */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50 space-y-3">
              <div className="flex items-center gap-2">
                <textarea
                  rows={2}
                  disabled={isLoading}
                  placeholder={
                    isListening 
                      ? "Listening... speak clearly into your mic." 
                      : "Type your detailed technical response here..."
                  }
                  className="flex-1 bg-white border border-neutral-200 rounded-lg p-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-neutral-100"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendResponse();
                    }
                  }}
                />
                
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isLoading}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isListening 
                      ? "bg-red-50 text-red-600 border-red-200 animate-pulse" 
                      : "bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50"
                  }`}
                  title="Speech-to-text input helper"
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <button
                  onClick={handleSendResponse}
                  disabled={isLoading || !userInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white p-3.5 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="text-[10px] text-neutral-400 text-right pr-1">
                Tip: Type response and tap <span className="font-semibold text-neutral-500">Enter</span> to submit. Use mic for verbal practice.
              </div>
            </div>
          </div>
        )}

        {/* 3. STATE: VIEW RESULTS & ASSESSMENT (Active finish OR Selected from historical list) */}
        {((activeSession && activeSession.isFinished) || selectedPastSession) && (
          <div className="flex-1 bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-6 space-y-8 animate-fade-in">
            {/* Report Header */}
            {(() => {
              const session = selectedPastSession || activeSession!;
              const feedback = session.feedback;
              
              if (!feedback) return <p className="text-sm">Feedback is currently unavailable.</p>;

              return (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Award size={12} />
                        Verdicts Overview
                      </span>
                      <h3 className="text-xl font-display font-semibold text-neutral-900">
                        AI Board Scorecard Report
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Evaluated against {session.level} criteria for {session.role} roles at {session.company}.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                      <div className="relative flex items-center justify-center">
                        {/* Circular Progress Gauge */}
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle cx="32" cy="32" r="28" fill="transparent" stroke="#e5e5e5" strokeWidth="6" />
                          <circle 
                            cx="32" 
                            cy="32" 
                            r="28" 
                            fill="transparent" 
                            stroke={feedback.score >= 80 ? "#10b981" : feedback.score >= 60 ? "#f59e0b" : "#ef4444"} 
                            strokeWidth="6" 
                            strokeDasharray={2 * Math.PI * 28}
                            strokeDashoffset={2 * Math.PI * 28 * (1 - feedback.score / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-base font-display font-bold text-neutral-800">{feedback.score}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">Performance Rate</span>
                        <span className={`text-sm font-bold ${
                          feedback.score >= 80 ? "text-emerald-600" : feedback.score >= 60 ? "text-amber-600" : "text-red-500"
                        }`}>
                          {feedback.score >= 80 ? "Elite Delivery" : feedback.score >= 60 ? "Proficient Solution" : "Needs Consolidation"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Narrative */}
                  <div className="space-y-2.5">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Recruiter Match Summary</h4>
                    <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-100 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                      {feedback.chatSummary}
                    </div>
                  </div>

                  {/* Strengths & Weaknesses Split Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-emerald-50/20 border border-emerald-100 rounded-xl p-5 space-y-3.5">
                      <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        Demonstrated Strengths
                      </h4>
                      <ul className="space-y-2.5">
                        {feedback.strengths.map((str, idx) => (
                          <li key={idx} className="text-slate-700 text-xs flex items-start gap-2">
                            <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-orange-50/20 border border-orange-100 rounded-xl p-5 space-y-3.5">
                      <h4 className="text-sm font-bold text-orange-800 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                        Constructive Gaps
                      </h4>
                      <ul className="space-y-2.5">
                        {feedback.weaknesses.map((weak, idx) => (
                          <li key={idx} className="text-slate-700 text-xs flex items-start gap-2">
                            <span className="text-orange-500 font-bold shrink-0 mt-0.5">!</span>
                            <span>{weak}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actionable Suggestions / Roadmap */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Syllabus Study Roadmap</h4>
                    <div className="p-5 border border-neutral-200 rounded-xl space-y-3">
                      {feedback.suggestions.map((sug, idx) => (
                        <div key={idx} className="flex gap-3 text-xs text-neutral-700 items-start">
                          <div className="p-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold shrink-0">
                            0{idx + 1}
                          </div>
                          <span className="leading-relaxed">{sug}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Option to review transcript dialogue log */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Review Dialogue Log</h4>
                    <div className="p-4 bg-neutral-50 rounded-xl space-y-4 max-h-[250px] overflow-y-auto border border-neutral-100">
                      {session.history.map((msg, idx) => (
                        <div key={idx} className="text-xs space-y-1">
                          <span className={`font-bold ${msg.role === "candidate" ? "text-indigo-600" : "text-neutral-700"}`}>
                            {msg.role === "candidate" ? "You (Candidate)" : "AI Board Panel"}:
                          </span>
                          <p className="text-neutral-600 pl-2 leading-relaxed">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}
