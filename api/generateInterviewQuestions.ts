import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { verifyToken } from './_verifyToken';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decodedToken = await verifyToken(req);

    const { jobDescription, resume } = req.body;
    const model = 'gemini-2.5-flash';
    
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
      
      const shuffled = generalQuestions.sort(() => 0.5 - Math.random());
      return res.status(200).json(shuffled.slice(0, 3));
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

    const generatePromise = ai.models.generateContent({
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

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Generation timed out')), 30000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]) as any;

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }
    
    const parsed = JSON.parse(text) as string[];
    res.status(200).json(parsed);

  } catch (error: any) {
    console.error('Error in generateInterviewQuestions:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: error.message });
  }
}
