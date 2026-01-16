import React, { useState, useEffect } from 'react';
import { Message, InterviewContext } from '../services/ConversationEngine';
import { generateFeedback, Feedback } from '../services/feedbackService';
import { loadProfile } from '../services/db';

interface AssessmentViewProps {
    history: Message[];
}

const AssessmentView: React.FC<AssessmentViewProps> = ({ history }) => {
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [context, setContext] = useState<InterviewContext | null>(null);

    useEffect(() => {
        const fetchContext = async () => {
            const profile = await loadProfile();
            if (profile) {
                setContext({
                    recruiterName: profile.recruiterName,
                    difficulty: profile.difficulty,
                    interviewType: profile.interviewType,
                    candidateName: profile.candidateName,
                    contextFile: profile.contextFile,
                });
            }
        };
        fetchContext();
    }, []);

    const handleAssess = async () => {
        if (!context) {
            setError('Recruiter profile not loaded.');
            return;
        }
        if (history.length === 0) {
            setError('No conversation history to analyze. Please start an interview first.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await generateFeedback(history, context);
            setFeedback(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate feedback.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="assessment-container">
            <h2 className="assessment-header">
                Response Assessment
            </h2>

            <div style={{ marginBottom: '2rem' }}>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                    Get instant feedback on your last response to improve your interview skills.
                </p>
                <button
                    onClick={handleAssess}
                    disabled={loading || !context}
                    style={{
                        padding: '0.75rem 1.5rem',
                        width: '100%',
                        maxWidth: '300px'
                    }}
                >
                    {loading ? 'Analyzing...' : 'Assess Last Response'}
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--color-danger)',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    border: '1px solid var(--color-danger)'
                }}>
                    {error}
                </div>
            )}

            {feedback && (
                <div className="grid">
                    {/* Score Card */}
                    <div className="assessment-card">
                        <h3 className="card-label">
                            Quality Score
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="score-display" style={{
                                color: feedback.score >= 70 ? 'var(--color-success)' : feedback.score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'
                            }}>
                                {feedback.score}%
                            </div>
                            <div className="score-bar-bg">
                                <div className="score-bar-fill" style={{
                                    width: `${feedback.score}%`,
                                    backgroundColor: feedback.score >= 70 ? 'var(--color-success)' : feedback.score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)',
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Critique Card */}
                    <div className="assessment-card">
                        <h3 className="card-label">
                            Critique
                        </h3>
                        <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                            {feedback.critique}
                        </p>
                    </div>

                    {/* Better Response Card */}
                    <div className="assessment-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                        <h3 className="card-label" style={{ color: 'var(--color-primary)' }}>
                            Better Response Example
                        </h3>
                        <p style={{ fontSize: '1rem', lineHeight: '1.6', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                            "{feedback.betterResponse}"
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssessmentView;
