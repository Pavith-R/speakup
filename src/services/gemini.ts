import { GoogleGenAI, Type } from "@google/genai";

// Initialize with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AnalysisResult {
  transcript: string;
  score: number;
  feedback: {
    clarity: number;
    pacing: number;
    wpm: number;
    fillerWords: number;
    structure: number;
    tips: string[];
  };
}

export async function analyzeSpeech(
  audioBase64: string, 
  mimeType: string, 
  userContext: {
    goals: string[];
    experienceLevel: string;
    weakness: string;
  }
): Promise<AnalysisResult> {
  try {
    // Use Gemini 2.5 Flash for fast, multimodal analysis
    const model = "gemini-2.5-flash";
    
    const prompt = `
      You are an expert speech coach. Analyze the following audio recording of a user practicing their speech.
      
      User Profile:
      - Goals: ${userContext.goals.join(', ') || "General improvement"}
      - Experience Level: ${userContext.experienceLevel || "Unknown"}
      - Known Weakness: ${userContext.weakness || "None specified"}
      
      You MUST provide a complete analysis with ALL of the following fields:
      1. "transcript": A verbatim transcript of the speech.
      2. "score": An overall score (0-100).
      3. "feedback": An object containing:
         - "clarity": Score (0-100)
         - "pacing": Score (0-100)
         - "wpm": Words per minute (calculate based on transcript length and audio duration)
         - "fillerWords": Count of filler words (um, ah, like, etc.)
         - "structure": Score (0-100)
         - "tips": Array of 3 actionable tips
      
      Return the result as a valid JSON object matching the schema exactly. Do not omit any fields.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: prompt },
          {
            // The AI is NOT given a transcript; it "listens" to this audio data directly.
            // Gemini 2.5 Flash is multimodal and can process audio to generate the transcript and analysis.
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
          properties: {
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
                  items: { type: Type.STRING }
                }
              },
              required: ["clarity", "pacing", "wpm", "fillerWords", "structure", "tips"]
            }
          },
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
