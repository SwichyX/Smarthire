import { supabase } from './supabaseClient';

export interface RecruiterProfile {
    id: string;
    recruiterName: string;
    difficulty: string;
    interviewType: string;
    candidateName: string;
    contextFile: string;
}

// Database uses snake_case, TypeScript uses camelCase
// Using 'any' to support both schemas dynamically
interface DbRecruiterProfile {
    id: string;
    [key: string]: any;
}

const TABLE_NAME = 'recruiter_config';

// Convert from database format to TypeScript format
function fromDbFormat(dbProfile: DbRecruiterProfile): RecruiterProfile {
    // Try new schema first
    if (dbProfile.recruiter_name !== undefined) {
        return {
            id: dbProfile.id,
            recruiterName: dbProfile.recruiter_name,
            difficulty: dbProfile.difficulty || '',
            interviewType: dbProfile.interview_type || '',
            candidateName: dbProfile.candidate_name || '',
            contextFile: dbProfile.context_file || '',
        };
    }

    // Fallback to old schema (repurposed columns)
    // role -> recruiterName
    // sector -> contextFile
    // interview_type -> JSON string or plain string
    let interviewType = dbProfile.interview_type;
    let difficulty = 'Medium';

    try {
        // Try to parse interview_type as JSON if we stored difficulty there
        if (interviewType.startsWith('{')) {
            const parsed = JSON.parse(interviewType);
            interviewType = parsed.type;
            difficulty = parsed.difficulty;
        }
    } catch (e) {
        // Ignore JSON parse error, treat as plain string
    }

    return {
        id: dbProfile.id,
        recruiterName: dbProfile.role || 'SmartHire Recruiter',
        difficulty: difficulty,
        interviewType: interviewType,
        candidateName: dbProfile.candidate_name,
        contextFile: dbProfile.sector || '',
    };
}

export async function saveProfile(profile: RecruiterProfile): Promise<void> {
    // Input validation
    if (profile.recruiterName.length > 100) throw new Error('Recruiter Name too long');
    if (profile.candidateName.length > 100) throw new Error('Candidate Name too long');
    if (profile.contextFile.length > 500000) throw new Error('Context file too large');

    // Strategy: Try to save using the NEW schema.
    // If it fails (likely due to missing columns), fallback to the OLD schema.

    const newSchemaProfile = {
        id: profile.id,
        recruiter_name: profile.recruiterName,
        difficulty: profile.difficulty,
        interview_type: profile.interviewType,
        candidate_name: profile.candidateName,
        context_file: profile.contextFile,
    };

    const { error: newSchemaError } = await supabase
        .from(TABLE_NAME)
        .upsert(newSchemaProfile, { onConflict: 'id' });

    if (!newSchemaError) {
        return; // Success!
    }

    console.warn('Failed to save with new schema, attempting fallback to old schema...', newSchemaError);

    // Fallback: Repurpose old columns
    const oldSchemaProfile = {
        id: profile.id,
        role: profile.recruiterName, // Repurpose role
        sector: profile.contextFile || ' ', // Repurpose sector (cannot be null)
        interview_type: JSON.stringify({
            type: profile.interviewType,
            difficulty: profile.difficulty
        }),
        candidate_name: profile.candidateName,
    };

    const { error: oldSchemaError } = await supabase
        .from(TABLE_NAME)
        .upsert(oldSchemaProfile, { onConflict: 'id' });

    if (oldSchemaError) {
        console.error('Error saving profile (fallback failed):', oldSchemaError);
        throw new Error(oldSchemaError.message);
    }
}

export async function loadProfile(): Promise<RecruiterProfile | null> {
    // Load the single profile (id = '1')
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', '1')
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows returned, profile doesn't exist yet
            return null;
        }
        console.error('Error loading profile:', error);
        throw new Error(error.message);
    }

    return fromDbFormat(data as DbRecruiterProfile);
}

export async function getProfile(id: string): Promise<RecruiterProfile | null> {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return fromDbFormat(data as DbRecruiterProfile);
}

export async function deleteProfile(id: string): Promise<void> {
    const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting profile:', error);
        throw new Error(error.message);
    }
}

export async function saveGeneratedQuestion(
    recruiterName: string,
    interviewType: string,
    difficulty: string,
    questionText: string
): Promise<void> {
    const { error } = await supabase
        .from('interview_questions')
        .insert({
            recruiter_name: recruiterName,
            interview_type: interviewType,
            difficulty: difficulty,
            question_text: questionText,
        });

    if (error) {
        console.error('Error saving generated question:', error);
        // We don't throw here to avoid interrupting the interview flow if logging fails
    }
}

export async function getPastQuestions(
    recruiterName: string,
    interviewType: string,
    difficulty: string
): Promise<string[]> {
    const { data, error } = await supabase
        .from('interview_questions')
        .select('question_text')
        .eq('recruiter_name', recruiterName)
        .eq('interview_type', interviewType)
        .eq('difficulty', difficulty);

    if (error) {
        console.error('Error fetching past questions:', error);
        return [];
    }

    return data.map((row: any) => row.question_text);
}
