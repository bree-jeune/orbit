
import { AI_CONFIG } from './aiService';
import { OrbitItem } from '../engine/types';

export interface ThemeResult {
    visual: {
        background: string; // CSS gradient value
        accent: string;     // Hex color
        textColor: string;  // Hex color for text (high contrast)
    };
    audio: {
        bpm: number;        // Beats per minute (60-120)
        roughness: number;  // 0-1 (clean vs distorted)
        key: string;        // e.g. "C_MAJOR", "F_MINOR"
        noiseType: 'brownNoise' | 'pinkNoise' | 'ambient';
    };
    mood: string;         // Description
}

export const themeService = {
    /**
     * Generate a theme based on the current items in orbit
     */
    async generateTheme(items: OrbitItem[], apiKey: string): Promise<ThemeResult> {
        // Summarize items for the prompt to save tokens
        const itemSummaries = items.slice(0, 5).map(i => i.title).join(', ');

        const prompt = `
      Act as an audiovisual artist. Generate a "vibe" (visuals and audio parameters) based on these tasks:
      "${itemSummaries}"
      
      If the tasks are stressful/urgent, use warmer colors (red/orange) and higher BPM.
      If the tasks are calm/creative, use cooler colors (blue/teal/purple) and lower BPM.
      
      Return JSON ONLY:
      {
        "visual": {
          "background": "valid linear-gradient CSS string (e.g. 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)')",
          "accent": "hex color code for buttons",
          "textColor": "hex color code for text (Ensure high contrast with background, usually #ffffff or #000000)"
        },
        "audio": {
          "bpm": number (40-100),
          "roughness": number (0.0 to 1.0),
          "key": "musical key string",
          "noiseType": "brownNoise" | "pinkNoise" | "ambient" (Use brown for focus/deep work, pink for balance, ambient for space)
        },
        "mood": "short description of the mood"
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
                        temperature: 0.8,
                        topP: 0.95,
                        topK: 40,
                        maxOutputTokens: 1024,
                        responseMimeType: "application/json"
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Theme Service Error Body:', errorData);
                throw new Error(`Theme Service request failed: ${response.status}`);
            }

            const data = await response.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!rawText) throw new Error('No content in AI response');

            const jsonStr = rawText.replace(/```json|```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('Theme Gen Error:', error);
            // Fallback theme
            return {
                visual: {
                    background: 'linear-gradient(to bottom, #0f172a, #1e1e2e)',
                    accent: '#00E5FF',
                    textColor: '#ffffff'
                },
                audio: { bpm: 60, roughness: 0, key: 'C_MAJOR', noiseType: 'ambient' },
                mood: 'default cosmic'
            };
        }
    }
};
