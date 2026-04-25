// Define interfaces inline
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
  const response = await fetch('/api/analyzeSpeech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audioBase64, mimeType, userContext }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze speech');
  }

  return response.json();
}

export async function generateInterviewQuestions(
  jobDescription?: string,
  resume?: string
): Promise<string[]> {
  try {
    const response = await fetch('/api/generateInterviewQuestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobDescription, resume }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate questions');
    }

    return response.json();
  } catch (error) {
    console.error("Error generating interview questions:", error);
    return [
      "Walk me through your background and experience.",
      "Tell me about a time you handled a conflict with a coworker.",
      "What are your greatest strengths and weaknesses?"
    ];
  }
}

