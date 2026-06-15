export interface InterviewMessage {
  role: "interviewer" | "candidate";
  text: string;
}

export interface MockInterviewFeedback {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  chatSummary: string;
}

export interface MockInterviewSession {
  id: string;
  role: string;
  company: string;
  level: string;
  timestamp: string;
  history: InterviewMessage[];
  isFinished: boolean;
  feedback?: MockInterviewFeedback;
}

export interface STARExtract {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface STARScores {
  situation: number;
  task: number;
  action: number;
  result: number;
}

export interface STARStoryAnalysis {
  id: string;
  promptQuestion: string;
  storyText: string;
  parsed: STARExtract;
  scores: STARScores;
  overallScore: number;
  improvementTips: string[];
  idealRewrite: string;
  timestamp: string;
}

export interface ResumeAnalysisResult {
  score: number;
  feedback: {
    impact: string;
    technicalMatch: string;
    readability: string;
  };
  suggestions: string[];
  targetRole: string;
  timestamp: string;
}

export interface RoadmapStep {
  title: string;
  description: string;
}

export interface TechQuestion {
  id: string;
  question: string;
  sampleAnswer: string;
  category: string;
}

export interface TechPackage {
  field: string;
  level: string;
  roadmapSteps: RoadmapStep[];
  questions: TechQuestion[];
  timestamp: string;
}

export interface CodeEvaluationResult {
  id: string;
  code: string;
  language: string;
  problemDescription: string;
  correctness: string;
  performance: string;
  edgeCases: string;
  fixedCode: string;
  explanation: string;
  timestamp: string;
}
