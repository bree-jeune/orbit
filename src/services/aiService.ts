
import { OrbitItem } from '../engine/types';

export const AI_CONFIG = {
    MODEL: 'gemini-1.5-flash',
    API_URL: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
    DEFAULT_KEY: 'AIzaSyBbQ1gLgv6-Wj-jLgPTXzF1MrPYzuRfYMo',
};

export interface AIParsedResult {
    title: string;
    detail?: string;
    suggestedTime?: number; // Hour of day 0-23
    suggestedContext?: 'home' | 'work';
    confidence: number;
}

export const aiService = {
    /**
     * Parse natural language input into structured data
     */
    async parseInput(text: string, apiKey: string): Promise<AIParsedResult> {
        const keySnippet = apiKey ? `${apiKey.substring(0, 6)}...` : 'NONE';
        console.log(`[AI] Parsing input with key: ${keySnippet}`);

        const prompt = `
      You are an intelligent assistant for a task management app called Orbit.
      Analyze the following user input and extract the intent.
      
      Input: "${text}"
      
      Return JSON ONLY with this structure:
      {
        "title": "Concise task title",
        "detail": "Any extra details mentioned (optional)",
        "suggestedTime": number (0-23 hour based on context, e.g. "morning" -> 9, "evening" -> 19, null if unspecified),
        "suggestedContext": "home" | "work" (infer from content, null if unsure),
        "confidence": number (0-1)
      }
    `;

        try {
            const response = await fetch(`${AI_CONFIG.API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.95,
                        topK: 40,
                        maxOutputTokens: 1024,
                        responseMimeType: "application/json"
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('AI Service Error Body:', errorData);
                throw new Error(`AI Service request failed: ${response.status}`);
            }

            const data = await response.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!rawText) return throwError();

            // Clean up markdown code blocks if present
            const jsonStr = rawText.replace(/```json|```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('AI Parse Error:', error);
            throw error;
        }
    }
};

function throwError(): never {
    throw new Error('Failed to parse AI response');
}
