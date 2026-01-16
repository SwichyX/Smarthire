import { GoogleGenerativeAI } from '@google/generative-ai';

// Access your API key as an environment variable
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
    console.error('VITE_GEMINI_API_KEY is not configured. Please add it to your .env file.');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

export async function generateInterviewQuestion(
    context: string,
    history: { role: 'user' | 'model'; parts: string }[]
): Promise<string> {
    // Input validation
    if (!context || context.trim().length === 0) {
        throw new Error('Context cannot be empty');
    }

    if (context.length > 100000) {
        throw new Error('Context is too long');
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const chat = model.startChat({
            history: history.map(h => ({
                role: h.role,
                parts: [{ text: h.parts }],
            })),
            generationConfig: {
                maxOutputTokens: 25635,
                temperature: 0.7,
            },
        });

        const result = await chat.sendMessage(context);
        const response = await result.response;
        const text = response.text();

        // Validate response
        if (!text || text.trim().length === 0) {
            throw new Error('Empty response from AI');
        }

        return text;
    } catch (error: any) {
        console.error('Error generating question with Gemini:', error.message || 'Unknown error');
        throw new Error('Failed to generate interview question');
    }
}
