import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Lazy-initialize Gemini AI
let aiInstance: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      console.warn("WARNING: GEMINI_API_KEY is not set or placeholder. Please configure in Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// -----------------------------------------------------
// 1. API: HEALTH CHECK
// -----------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// -----------------------------------------------------
// 2. API: MOCK INTERVIEW START
// -----------------------------------------------------
app.post("/api/gemini/mock-interview-start", async (req, res) => {
  try {
    const { role, company, level, description } = req.body;
    if (!role || !level) {
      res.status(400).json({ error: "Role and Experience Level are required fields." });
      return;
    }

    const ai = getGeminiAI();
    const systemPrompt = `You are an elite Lead Interviewer at a prestigious company. You are conducting an technical and behavioral mock interview for a ${level} candidate role of ${role} ${company ? `at ${company}` : ""}.
${description ? `Candidate background/context: ${description}.` : ""}
Your goal is to simulate a realistic, highly professional interview. Keep your questions targeted, industry-aligned, and strictly in-character as an interviewer.
Generate ONLY the very first interview question. Do not start with long preambles, just give a polite welcome and launch into the first crisp, context-appropriate technical or behavioral question.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Start the interview by offering a warm greeting and asking the first question.",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: "The welcome greeting followed by the first clear interview question."
            }
          },
          required: ["question"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response generated from Gemini.");
    }

    const parsed = JSON.parse(resultText);
    res.json({
      question: parsed.question,
      history: [
        { role: "interviewer", text: parsed.question }
      ]
    });
  } catch (error: any) {
    console.error("Mock Interview Start Error:", error);
    res.status(500).json({ error: error.message || "Failed to start interview session" });
  }
});

// -----------------------------------------------------
// 3. API: MOCK INTERVIEW RESPOND & DIALOGUE STEP
// -----------------------------------------------------
app.post("/api/gemini/mock-interview-respond", async (req, res) => {
  try {
    const { role, company, level, history, userInput, currentQuestionIndex, totalQuestions } = req.body;
    
    if (!history || !Array.isArray(history) || !userInput) {
      res.status(400).json({ error: "History array and candidate response are required." });
      return;
    }

    const ai = getGeminiAI();
    const isLastQuestion = currentQuestionIndex >= totalQuestions;

    // Build complete context history for Gemini
    const formattedHistory = history.map(item => {
      return `${item.role === "interviewer" ? "Interviewer" : "Candidate"}: ${item.text}`;
    }).join("\n");

    const systemPrompt = `You are conducting a strict ${level} ${role} interview ${company ? `at ${company}` : ""}.
Full accumulated interview logs so far:
${formattedHistory}

Candidate's latest answer: "${userInput}"

Your response behavior depends on the state:
- If this is NOT the final question (current index: ${currentQuestionIndex} / total: ${totalQuestions}):
  Your task is to:
  1. Act in-character.
  2. Briefly acknowledge the candidate's latest response or ask a follow-up clarification if preferred, but always formulate a distinct Next Question.
  Make sure to return JSON matching the next question schema.

- If this IS the final answer (current index is ${currentQuestionIndex} and is the last round):
  Your task is to:
  1. End the interview cordially in character.
  2. Perform a full comprehensive evaluation of the candidate. Provide a constructive score (0-100), key strengths, constructive weaknesses, actionable roadmap suggestions, and a precise chat summary.
  Make sure to return JSON matching the feedback schema.`;

    if (!isLastQuestion) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Evaluate user response and generate the next interview question.",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nextQuestion: {
                type: Type.STRING,
                description: "Brief transition followed by the next official interview question."
              }
            },
            required: ["nextQuestion"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({
        nextQuestion: parsed.nextQuestion,
        isFinished: false,
        history: [
          ...history,
          { role: "candidate", text: userInput },
          { role: "interviewer", text: parsed.nextQuestion }
        ]
      });
    } else {
      // The interview is completed. Generate complete assessment!
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Conduct a comprehensive review of the entire transcript. Summarize performance.",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.INTEGER,
                description: "Overall interview performance score from 0 to 100."
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of key technical or communication strengths demonstrated."
              },
              weaknesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key areas of constructive improvement."
              },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Actionable concrete study topics or behavior tips."
              },
              chatSummary: {
                type: Type.STRING,
                description: "A summary evaluating their fitment for target level and final review notes."
              }
            },
            required: ["score", "strengths", "weaknesses", "suggestions", "chatSummary"]
          }
        }
      });

      const feedback = JSON.parse(response.text || "{}");
      res.json({
        isFinished: true,
        feedback,
        history: [
          ...history,
          { role: "candidate", text: userInput }
        ]
      });
    }
  } catch (error: any) {
    console.error("Mock Interview dialogue error:", error);
    res.status(500).json({ error: error.message || "Something went wrong during interview processing" });
  }
});

// -----------------------------------------------------
// 4. API: RESUME ANALYZER
// -----------------------------------------------------
app.post("/api/gemini/resume-analyze", async (req, res) => {
  try {
    const { resumeText, targetRole } = req.body;
    if (!resumeText) {
      res.status(400).json({ error: "Please enter your resume text." });
      return;
    }

    const ai = getGeminiAI();
    const systemPrompt = `You are a Principal Tech Recruiter and hiring consultant at a top company.
Analyze this raw resume text against the target role: "${targetRole || "Software Engineer"}"
Provide:
- An overall ATS match & quality score (0-100).
- Detailed feedback broken down into: Impact statements (quantifiability), Technical Skills Alignment, readability/clarity of descriptions.
- Constructive suggestions to improve descriptions, phrasing (e.g. replacing passive words with strong active verbs and metrics).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: resumeText,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: "ATS and Recruiter alignment score out of 100."
            },
            feedback: {
              type: Type.OBJECT,
              properties: {
                impact: { type: Type.STRING, description: "Feedback on metric quantization and actual outcomes." },
                technicalMatch: { type: Type.STRING, description: "Feedback on matching requested keywords or modern stacks." },
                readability: { type: Type.STRING, description: "Feedback on format, flow, size, and layout suggestions." }
              },
              required: ["impact", "technicalMatch", "readability"]
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 4-6 highly specific actionable suggestions for bullet point copy edits."
            }
          },
          required: ["score", "feedback", "suggestions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Resume analysis error:", error);
    res.status(500).json({ error: error.message || "Undergoing technical issues scanner-side" });
  }
});

// -----------------------------------------------------
// 5. API: STAR BEHAVIORAL ANALYZER
// -----------------------------------------------------
app.post("/api/gemini/behavioral-STAR", async (req, res) => {
  try {
    const { storyText, promptQuestion } = req.body;
    if (!storyText) {
      res.status(400).json({ error: "Story text is required to evaluate." });
      return;
    }

    const ai = getGeminiAI();
    const systemPrompt = `You are a hiring manager who is an expert in the STAR method (Situation, Task, Action, Result).
Evaluate the candidate's draft answer to the behavioral question "${promptQuestion || "Tell me about a challenging situation and how you overcame it"}".
Draft text: "${storyText}"

Your goal:
1. Parse the story into the distinct categories: Situation, Task, Action, Result. Highlight which parts fit where, or state clearly if a section was missing.
2. Score each section from 0 to 10 based on depth, clarity, and quantitative results.
3. Compute an overall STAR score (0-100).
4. Identify action gaps (e.g. details missing, passive voice, missing outcomes).
5. Generate an Ideal Rewrite using the exact STAR structure with polished professional typography and strong action verbs.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: storyText,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            parsed: {
              type: Type.OBJECT,
              properties: {
                situation: { type: Type.STRING },
                task: { type: Type.STRING },
                action: { type: Type.STRING },
                result: { type: Type.STRING }
              },
              required: ["situation", "task", "action", "result"]
            },
            scores: {
              type: Type.OBJECT,
              properties: {
                situation: { type: Type.INTEGER },
                task: { type: Type.INTEGER },
                action: { type: Type.INTEGER },
                result: { type: Type.INTEGER }
              },
              required: ["situation", "task", "action", "result"]
            },
            overallScore: { type: Type.INTEGER },
            improvementTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            idealRewrite: { type: Type.STRING, description: "A comprehensive, beautifully worded reformatted STAR story based on the candidate input." }
          },
          required: ["parsed", "scores", "overallScore", "improvementTips", "idealRewrite"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("STAR Evaluator error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze behavioral response" });
  }
});

// -----------------------------------------------------
// 6. API: TECHNICAL roadmap & roadmap quiz generator
// -----------------------------------------------------
app.post("/api/gemini/technical-generator", async (req, res) => {
  try {
    const { field, level } = req.body;
    if (!field) {
      res.status(400).json({ error: "Technical Field is required." });
      return;
    }

    const ai = getGeminiAI();
    const systemPrompt = `You are an industry principal expert. Generates technical learning roadmaps and curated interview preparation packages for domain: "${field}" at experience level: "${level || "Mid-Level"}".
Generate:
- 5 main Sequential structured Steps representing a modern, solid technical study path.
- 5 curated high-frequency actual interview questions for this matching domain. Each question must have a precise, highly professional 'sampleAnswer' explaining the concept in detail, including standard diagrams or clean JSX/TS/Python code examples where helpful.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Create roadmap and flashcard questions for ${level} ${field}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roadmapSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "The skill node title (e.g., 'Concurrency and Event Loop')" },
                  description: { type: Type.STRING, description: "What to focus on, resources to reference, and core concepts." }
                },
                required: ["title", "description"]
              }
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING, description: "Interview question text." },
                  sampleAnswer: { type: Type.STRING, description: "Highly educational response clarifying key parameters with clean formatting." },
                  category: { type: Type.STRING }
                },
                required: ["id", "question", "sampleAnswer", "category"]
              }
            }
          },
          required: ["roadmapSteps", "questions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Tech generator error:", error);
    res.status(500).json({ error: error.message || "Failed to synthesize core conceptual guidelines" });
  }
});

// -----------------------------------------------------
// 7. API: CODE REVIEW & EVALUATOR
// -----------------------------------------------------
app.post("/api/gemini/code-evaluate", async (req, res) => {
  try {
    const { code, language, problemDescription } = req.body;
    if (!code) {
      res.status(400).json({ error: "Code content is empty." });
      return;
    }

    const ai = getGeminiAI();
    const systemPrompt = `You are a Lead Software Architect. Carefully review this candidate's solution written in "${language || "TypeScript"}".
${problemDescription ? `Target Problem: ${problemDescription}` : ""}

Evaluate:
- Correctness and code logic.
- Big-O complexity (Time and Space) under performance metrics.
- Edge Cases (such as empty list, overflow, nulls, negative bounds).
- Provide an optimized, clean alternative (with comments) in 'fixedCode'.
- Give a friendly but strict academic 'explanation' of your findings.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: code,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctness: { type: Type.STRING, description: "Review of syntax, correct logic flow, bug spots." },
            performance: { type: Type.STRING, description: "Time and Space Complexity overview (e.g. Time: O(N), Space: O(1))." },
            edgeCases: { type: Type.STRING, description: "How can the code break? What cases were not considered?" },
            fixedCode: { type: Type.STRING, description: "The optimized, pristine codebase with clear annotations." },
            explanation: { type: Type.STRING, description: "Summary review advice & tips." }
          },
          required: ["correctness", "performance", "edgeCases", "fixedCode", "explanation"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Code evaluation error:", error);
    res.status(500).json({ error: error.message || "Code feedback compiler failed" });
  }
});

export default app;
