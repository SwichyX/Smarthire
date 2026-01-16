import { generateInterviewQuestion } from './gemini';
import { SYSTEM_PROMPT_TEMPLATE } from './prompts';
import { saveGeneratedQuestion, getPastQuestions } from './db';

export type Message = {
    role: 'user' | 'model';
    parts: string;
};

export type InterviewContext = {
    recruiterName: string;
    difficulty: string;
    interviewType: string;
    candidateName: string;
    contextFile: string;
};

export class ConversationEngine {
    private history: Message[] = [];
    private context: InterviewContext;

    constructor(context: InterviewContext, history: Message[] = []) {
        this.context = context;
        this.history = history;
    }

    private getSystemPrompt(): string {
        return SYSTEM_PROMPT_TEMPLATE
            .replace('{{recruiterName}}', this.context.recruiterName)
            .replace('{{difficulty}}', this.context.difficulty)
            .replace('{{interviewType}}', this.context.interviewType)
            .replace('{{candidateName}}', this.context.candidateName)
            .replace('{{contextFile}}', this.context.contextFile);
    }

    async startInterview(): Promise<string> {
        const systemPrompt = this.getSystemPrompt();

        // Add an initial user message to start the conversation
        // This ensures the history starts with 'user' role as required by Gemini API
        const initialUserMessage = "Hello, I'm ready to begin the interview.";
        this.history.push({ role: 'user', parts: initialUserMessage });

        // Fetch past questions to exclude
        const pastQuestions = await getPastQuestions(
            this.context.recruiterName,
            this.context.interviewType,
            this.context.difficulty
        );

        let exclusionPrompt = "";
        if (pastQuestions.length > 0) {
            exclusionPrompt = `\n\nIMPORTANT: Do NOT ask any of the following questions again:\n- ${pastQuestions.join('\n- ')}`;
        }

        const response = await generateInterviewQuestion(
            systemPrompt + exclusionPrompt + `\n\nThe candidate is ready. Please greet them warmly and ask your first interview question. Remember to align it with the "${this.context.interviewType}" type.`,
            this.history
        );

        this.history.push({ role: 'model', parts: response });

        // Save the generated question
        await saveGeneratedQuestion(
            this.context.recruiterName,
            this.context.interviewType,
            this.context.difficulty,
            response
        );

        return response;
    }

    async sendCandidateResponse(response: string): Promise<string> {
        // Sanitize and validate user input
        const sanitizedResponse = response.trim();

        if (!sanitizedResponse || sanitizedResponse.length === 0) {
            throw new Error('Response cannot be empty');
        }

        if (sanitizedResponse.length > 10000) {
            throw new Error('Response is too long. Please keep it under 10000 characters.');
        }

        this.history.push({ role: 'user', parts: sanitizedResponse });

        const systemPrompt = this.getSystemPrompt();

        // Fetch past questions to exclude
        const pastQuestions = await getPastQuestions(
            this.context.recruiterName,
            this.context.interviewType,
            this.context.difficulty
        );

        let exclusionPrompt = "";
        if (pastQuestions.length > 0) {
            exclusionPrompt = `\n\nIMPORTANT: Do NOT ask any of the following questions again:\n- ${pastQuestions.join('\n- ')}`;
        }

        const nextQuestion = await generateInterviewQuestion(
            systemPrompt + exclusionPrompt + "\n\nAnalyze the candidate's previous response. If it is relevant, proceed with the next interview question. If it is short, vague, or irrelevant, do NOT repeat the last question. Instead, acknowledge it briefly and PIVOT to a new question or scenario that helps you assess their fit for the role.",
            this.history
        );

        this.history.push({ role: 'model', parts: nextQuestion });

        // Save the generated question
        await saveGeneratedQuestion(
            this.context.recruiterName,
            this.context.interviewType,
            this.context.difficulty,
            nextQuestion
        );

        return nextQuestion;
    }

    getHistory(): Message[] {
        return this.history;
    }
}
