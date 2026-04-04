import { GoogleGenAI, Type } from "@google/genai";

// Initialize with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Tip {
  text: string;
  example?: string;
  timestamp?: string; // Format: "MM:SS"
}

export interface AnalysisResult {
  transcript: string;
  score: number;
  feedback: {
    clarity: number;
    pacing: number;
    wpm: number;
    fillerWords: number;
    structure: number;
    tips: Tip[];
    contentAnalysis?: {
      summary: string;
      strengths: string[];
      improvements: string[];
      hiringProbability?: number;
    };
  };
}

export async function analyzeSpeech(
  audioBase64: string, 
  mimeType: string, 
  userContext: {
    goals: string[];
    experienceLevel: string;
    weakness: string;
    context?: string;
    includeContentAnalysis?: boolean;
  }
): Promise<AnalysisResult> {
  try {
    // Use Gemini 2.5 Flash for fast, multimodal analysis
    const model = "gemini-2.5-flash";
    
    const includeContent = userContext.includeContentAnalysis !== false; // Default to true if not specified, but we will control it from callers

    let prompt = `
      You are an expert speech coach. Analyze the following audio recording of a user practicing their speech.
      
      User Profile:
      - Goals: ${userContext.goals.join(', ') || "General improvement"}
      - Experience Level: ${userContext.experienceLevel || "Unknown"}
      - Known Weakness: ${userContext.weakness || "None specified"}
      - Context: ${userContext.context || "General practice"}
      
      You MUST provide a complete analysis with ALL of the following fields:
      1. "transcript": A verbatim transcript of the speech.
      2. "score": An overall score (0-100).
      3. "feedback": An object containing:
         - "clarity": Score (0-100)
         - "pacing": Score (0-100)
         - "wpm": Words per minute (calculate based on transcript length and audio duration)
         - "fillerWords": Count of filler words (um, ah, like, etc.)
         - "structure": Score (0-100)
    `;

    if (includeContent) {
      prompt += `
         - "tips": Array of 0 to 3 actionable tips to improve their interview performance based SPECIFICALLY on what they said or how they said it. If their performance was excellent and there are no meaningful improvements, return an empty array. Each tip must be an object with "text" (the tip), "example" (a specific quote from the transcript), and "timestamp" (the approximate time in MM:SS format where the example occurred in the audio).
         - "contentAnalysis": An object containing:
            - "summary": A brief assessment of whether they answered well (1-2 sentences).
            - "strengths": Array of 2-3 strong points about the content.
            - "improvements": Array of 2-3 things they could have avoided or improved in the content.
            - "hiringProbability": If the context implies a job interview, provide a probability score (0-100) representing the likelihood of passing this interview question. If not an interview, return null.
      `;
    } else {
      prompt += `
         - "tips": Array of 0 to 3 actionable tips to improve their general speaking skills (e.g. pacing, clarity, tone, filler words) based SPECIFICALLY on their delivery. Do NOT focus on the content of the speech. If their delivery was excellent, return an empty array. Each tip must be an object with "text" (the tip), "example" (a specific quote from the transcript), and "timestamp" (the approximate time in MM:SS format where the example occurred in the audio).
      `;
    }
      
    prompt += `
      Return the result as a valid JSON object matching the schema exactly. Do not omit any fields.
    `;

    const schemaProperties: any = {
      transcript: { type: Type.STRING },
      score: { type: Type.NUMBER },
      feedback: {
        type: Type.OBJECT,
        properties: {
          clarity: { type: Type.NUMBER },
          pacing: { type: Type.NUMBER },
          wpm: { type: Type.NUMBER },
          fillerWords: { type: Type.NUMBER },
          structure: { type: Type.NUMBER },
          tips: {
            type: Type.ARRAY,
            items: { 
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                example: { type: Type.STRING },
                timestamp: { type: Type.STRING }
              },
              required: ["text"]
            }
          }
        },
        required: ["clarity", "pacing", "wpm", "fillerWords", "structure", "tips"]
      }
    };

    if (includeContent) {
      schemaProperties.feedback.properties.contentAnalysis = {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          improvements: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          hiringProbability: { type: Type.NUMBER }
        },
        required: ["summary", "strengths", "improvements"]
      };
      schemaProperties.feedback.required.push("contentAnalysis");
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: schemaProperties,
          required: ["transcript", "score", "feedback"]
        }
      }
    });

    const text = response.text;
    console.log("Gemini Raw Response:", text);
    
    if (!text) {
      throw new Error("No response from AI");
    }

    try {
      const parsed = JSON.parse(text) as AnalysisResult;
      // Validate structure
      if (!parsed.feedback || typeof parsed.score !== 'number') {
        throw new Error("Invalid response structure from AI");
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse Gemini response:", e);
      // Attempt to clean markdown code blocks if present
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanText) as AnalysisResult;
    }
  } catch (error: any) {
    console.error("Error analyzing speech:", error);
    if (error.message?.includes('400')) {
       throw new Error("Invalid audio format or content. Please try recording again.");
    }
    throw error;
  }
}

export async function generateInterviewQuestions(
  jobDescription?: string,
  resume?: string
): Promise<string[]> {
  try {
    const model = "gemini-2.5-flash";
    
    // If no specific context is provided, return a random selection of general questions
    if (!jobDescription && !resume) {
      const generalQuestions = [
        "Walk me through your background and experience.",
        "What are your greatest strengths and weaknesses?",
        "Why are you interested in this role/company?",
        "Tell me about a time you handled a conflict with a coworker.",
        "Describe a situation where you had to meet a tight deadline.",
        "Give an example of a time you failed — what did you learn?",
        "Tell me about a time you led a team or project.",
        "How would you handle a disagreement with your manager?",
        "Where do you see yourself in 5 years?",
        "What does success look like in this role in the first 90 days?"
      ];
      
      // Shuffle and pick 3
      const shuffled = generalQuestions.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    }

    let prompt = "You are an expert interviewer. Generate 3 distinct, challenging but fair interview questions.";
    
    if (jobDescription) {
      prompt += `\n\nThe candidate is applying for this role:\n"${jobDescription}"`;
    }
    
    if (resume) {
      prompt += `\n\nHere is the candidate's resume/experience:\n"${resume}"`;
    }
    
    prompt += `\n\nBased on the provided information, generate 3 specific interview questions.
    1. A behavioral question.
    2. A role-specific question.
    3. A situational or problem-solving question.
    
    Return ONLY a JSON array of strings, e.g. ["Question 1", "Question 2", "Question 3"]. Do not include markdown formatting.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }
    
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Error generating interview questions:", error);
    return [
      "Walk me through your background and experience.",
      "Tell me about a time you handled a conflict with a coworker.",
      "What are your greatest strengths and weaknesses?"
    ];
  }
}
