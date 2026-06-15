import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Briefcase,
  History,
  Calendar
} from "lucide-react";
import { ResumeAnalysisResult } from "../types";

const ROLE_TARGET_PRESETS = [
  "Frontend Developer",
  "Backend Architect",
  "Fullstack Engineer",
  "DevOps Engineer",
  "AI/ML Research Engineer",
  "Engineering Manager",
  "Product Manager"
];

const PAST_RESUME_DRAFTS = [
  {
    title: "Mani Reethika - Default Version",
    content: "Burukala Mani Reethika\nEmail: manireethikab@gmail.com\n\nExperience:\n- Developed websites using React, Redux and Tailwind CSS.\n- Collaborated with product team on design ideas.\n- Focused on debugging code and testing tools.\n- Improved speed of Web app.\n- Involved in backend databases like Node.js and MongoDB.\n\nSkills:\nReact, Redux, Node.js, Express, JavaScript, Git, CSS, HTML, MongoDB."
  }
];

interface ResumePanelProps {
  onResumeScanned: () => void;
}

export default function ResumePanel({ onResumeScanned }: ResumePanelProps) {
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState(ROLE_TARGET_PRESETS[2]);
  
  const [activeAnalysis, setActiveAnalysis] = useState<ResumeAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Past scans
  const [pastScans, setPastScans] = useState<ResumeAnalysisResult[]>([]);
  const [selectedPastScan, setSelectedPastScan] = useState<ResumeAnalysisResult | null>(null);

  useEffect(() => {
    loadPastScans();
  }, []);

  const loadPastScans = () => {
    const raw = localStorage.getItem("prep_hub_resumes");
    if (raw) {
      try {
        setPastScans(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleApplyPreset = (content: string) => {
    setResumeText(content);
  };

  const handleScanResume = async () => {
    if (!resumeText.trim()) return;

    setIsLoading(true);
    setError(null);
    setSelectedPastScan(null);

    try {
      const res = await fetch("/api/gemini/resume-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, targetRole })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to analyze resume content");
      }

      const data = await res.json();
      const newAnalysis: ResumeAnalysisResult = {
        score: data.score,
        feedback: data.feedback,
        suggestions: data.suggestions,
        targetRole,
        timestamp: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      };

      setActiveAnalysis(newAnalysis);

      const updatedScans = [newAnalysis, ...pastScans];
      localStorage.setItem("prep_hub_resumes", JSON.stringify(updatedScans));
      setPastScans(updatedScans);
      onResumeScanned(); // recalculate stats
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during resume scan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetScan = () => {
    setActiveAnalysis(null);
    setSelectedPastScan(null);
    setError(null);
    // don't clear resume text so they can edit it
  };

  const currentView = selectedPastScan || activeAnalysis;

  return (
    <div className="grid lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Target input stage */}
      <div className="lg:col-span-5 space-y-6">
        
        <div className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-semibold text-neutral-900 flex items-center gap-2">
              <FileText size={18} className="text-emerald-500" />
              ATS Feed Scanner
            </h3>
            {(activeAnalysis || selectedPastScan) && (
              <button 
                onClick={handleResetScan}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                New Scan
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Target Title / Role</label>
              <select 
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                {ROLE_TARGET_PRESETS.map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Paste Resume Content</label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400">Load sample:</span>
                  <button 
                    type="button" 
                    onClick={() => handleApplyPreset(PAST_RESUME_DRAFTS[0].content)}
                    className="text-[10px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Mani's CV Draft
                  </button>
                </div>
              </div>
              <textarea 
                rows={12}
                placeholder="Paste the plain textual content of your resume/CV here (sections: contact, summary, target profile, experience, stack/skills)."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button
              onClick={handleScanResume}
              disabled={isLoading || !resumeText.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-200 text-white p-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Auditing Technical Keywords...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Analyze Match with AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Saved Audits sidebar */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <Clock size={15} />
            Scan logs
          </h3>

          {pastScans.length === 0 ? (
            <p className="text-xs text-neutral-400 py-3 text-center">No cached scores found.</p>
          ) : (
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {pastScans.map((scan, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedPastScan(scan);
                    setActiveAnalysis(null);
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedPastScan?.timestamp === scan.timestamp && selectedPastScan?.score === scan.score
                      ? "bg-emerald-50/50 border-emerald-200" 
                      : "bg-white border-neutral-100 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Match: {scan.score}%</span>
                    <span className="text-[9px] text-neutral-400 flex items-center gap-1">
                      <Calendar size={9} />
                      {scan.timestamp}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-800 line-clamp-1">Role: {scan.targetRole}</h4>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Main output display stage */}
      <div className="lg:col-span-7 flex flex-col min-h-[500px]">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-xs flex items-center gap-3">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!currentView ? (
          <div className="flex-1 bg-neutral-50/50 rounded-2xl border-2 border-dashed border-neutral-200 p-12 flex flex-col items-center justify-center text-center space-y-5">
            <div className="p-4 bg-emerald-50 text-emerald-500 rounded-full">
              <FileText size={40} />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-display font-semibold text-neutral-900">ATS Match Optimizer</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Most top firms utilize automated Applicant Tracking Systems to screen resumes. Enter your current draft text on the left to check keyword saturation, discover formatting bottlenecks, and get metric rewrite rules.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-6 space-y-6 animate-fade-in flex-1">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Scan Verdict & Matching Analysis</span>
                <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-1.5">
                  Target Role: <span className="text-indigo-600">{currentView.targetRole}</span>
                </h3>
              </div>

              <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl border border-emerald-700/10 flex items-center gap-2">
                <span className="text-xl font-display font-extrabold">{currentView.score}%</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100">Compatibility Score</span>
              </div>
            </div>

            {/* Categorized Feedbacks */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Dimension Audits</h4>
              
              <div className="space-y-3.5">
                <div className="p-4 bg-lime-50/20 border border-lime-100 rounded-xl space-y-1.5">
                  <h5 className="text-xs font-bold text-lime-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-lime-500"></span>
                    Operational Impact Statements
                  </h5>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {currentView.feedback.impact}
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl space-y-1.5">
                  <h5 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Technical Keyword Saturation
                  </h5>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {currentView.feedback.technicalMatch}
                  </p>
                </div>

                <div className="p-4 bg-teal-50/20 border border-teal-100 rounded-xl space-y-1.5">
                  <h5 className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-teal-500"></span>
                    Core Readable Formatting
                  </h5>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {currentView.feedback.readability}
                  </p>
                </div>
              </div>
            </div>

            {/* Actionable Replacement Suggestions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-500" />
                Suggested Copy Replacements (Bullet Adjustors)
              </h4>
              <div className="p-4 border border-neutral-200 rounded-xl space-y-3.5">
                {currentView.suggestions.map((sug, idx) => (
                  <div key={idx} className="flex gap-3 text-xs text-slate-700 items-start">
                    <div className="p-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold shrink-0 mt-0.5">
                      0{idx + 1}
                    </div>
                    <span className="leading-relaxed bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 flex-1">{sug}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
