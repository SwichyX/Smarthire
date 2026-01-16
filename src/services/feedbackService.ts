import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message, InterviewContext } from './ConversationEngine';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
    console.error('VITE_GEMINI_API_KEY is not configured.');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

export interface Feedback {
    score: number;
    critique: string;
    betterResponse: string;
}

export async function generateFeedback(
    history: Message[],
    context: InterviewContext
): Promise<Feedback> {
    if (history.length === 0) {
        throw new Error('No conversation history to analyze.');
    }

    // Find the last user message
    const lastUserMessage = [...history].reverse().find(m => m.role === 'user');

    if (!lastUserMessage) {
        throw new Error('No candidate response found to analyze.');
    }

    // Find the question preceding the last user message
    const lastUserIndex = history.indexOf(lastUserMessage);
    const lastQuestion = history[lastUserIndex - 1]?.parts || "Start of interview";

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
    You are an expert interview coach. Analyze the candidate's response based SPECIFICALLY on how well it answers the question that was asked.

    Context:
    - Role/Goal: ${context.recruiterName} (Recruiter) interviewing for a role based on the provided job description.
    - Difficulty: ${context.difficulty}
    - Interview Type: ${context.interviewType}
    - Job Description: ${context.contextFile.slice(0, 1000)}... (truncated)

    Question Asked: "${lastQuestion}"
    Candidate's Response: "${lastUserMessage.parts}"

    CRITICAL: Evaluate the response quality based on:
    1. How directly and completely it addresses the SPECIFIC question asked
    2. Whether it provides relevant details and examples related to the question
    3. If it demonstrates understanding of what the question is asking for
    4. The depth and quality of the answer in relation to the question's requirements

    Do NOT evaluate the response in isolation. The score should reflect how well the candidate answered THIS SPECIFIC QUESTION.

    Provide your assessment in the following JSON format ONLY:
    {
        "score": <number between 0 and 100>,
        "critique": "<brief constructive critique focusing on how well the answer addressed the question, max 2 sentences>",
        "betterResponse": "<an example of a better response that directly answers the question asked>"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonString = text.replace(/```json\n|\n```/g, '').trim();

        const feedback: Feedback = JSON.parse(jsonString);
        return feedback;
    } catch (error) {
        console.error('Error generating feedback:', error);
        throw new Error('Failed to generate feedback. Please try again.');
    }
}
