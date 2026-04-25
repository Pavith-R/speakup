import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audioBase64, mimeType, userContext } = req.body;

    if (!audioBase64 || !mimeType || !userContext) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const model = 'gemini-2.5-flash';
    const includeContent = userContext.includeContentAnalysis !== false;

    let prompt = `
      You are an expert speech coach. Analyze the following audio recording of a user practicing their speech.
      
      User Profile:
      - Goals: ${(userContext.goals || []).join(', ') || 'General improvement'}
      - Experience Level: ${userContext.experienceLevel || 'Unknown'}
      - Known Weakness: ${userContext.weakness || 'None specified'}
      - Context: ${userContext.context || 'General practice'}
      
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
              required: ['text']
            }
          }
        },
        required: ['clarity', 'pacing', 'wpm', 'fillerWords', 'structure', 'tips']
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
        required: ['summary', 'strengths', 'improvements']
      };
      schemaProperties.feedback.required.push('contentAnalysis');
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
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: schemaProperties,
          required: ['transcript', 'score', 'feedback']
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response from AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleanText);
    }

    if (!parsed.feedback || typeof parsed.score !== 'number') {
      throw new Error('Invalid response structure from AI');
    }

    res.status(200).json(parsed);

  } catch (error: any) {
    console.error('Error in analyzeSpeech:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error.message });
  }
}
