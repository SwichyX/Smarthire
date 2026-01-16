import React, { useState, useEffect, useRef } from 'react';
import { saveProfile, loadProfile, RecruiterProfile } from '../services/db';
import { INTERVIEW_TYPES } from '../constants/recruiterOptions';

interface ProfileEditorProps {
    onReset?: () => void;
}

/**
 * Simple profile editor for recruiter configuration.
 * Allows creating a new profile or editing an existing one.
 */
const ProfileEditor: React.FC<ProfileEditorProps> = ({ onReset }) => {
    const [profile, setProfile] = useState<RecruiterProfile>({
        id: '1', // Single profile for now
        recruiterName: '',
        difficulty: 'Medium',
        interviewType: '',
        candidateName: '',
        contextFile: '',
    });
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load existing profile on mount
        const loadExistingProfile = async () => {
            try {
                const existingProfile = await loadProfile();
                if (existingProfile) {
                    setProfile(existingProfile);
                }
            } catch (error) {
                console.error('Failed to load profile:', error);
            }
        };
        loadExistingProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        setProfile((prev) => ({ ...prev, contextFile: text }));
    };

    const handleSave = async () => {
        // Validation
        if (!profile.recruiterName || !profile.interviewType || !profile.candidateName) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await saveProfile(profile);
            alert('Configuration saved successfully! You can now start the Live Interview.');
        } catch (err: any) {
            console.error(err);
            alert(err?.message || 'Failed to save configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm('Are you sure you want to reset the profile? This will delete all current settings and the uploaded file.')) {
            return;
        }

        const emptyProfile: RecruiterProfile = {
            id: '1',
            recruiterName: '',
            difficulty: '',
            interviewType: '',
            candidateName: '',
            contextFile: '',
        };

        setLoading(true);
        try {
            // Save empty profile to database (this clears all fields)
            await saveProfile(emptyProfile);

            // Update local state
            setProfile(emptyProfile);

            // Clear file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Call parent onReset if provided
            if (onReset) {
                onReset();
            }
        } catch (err: any) {
            console.error(err);
            alert(err?.message || 'Failed to reset profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text-accent)' }}>Recruiter Configuration</h3>
            <div className="grid">
                <div className="form-group">
                    <label className="form-label">
                        Recruiter Name *
                    </label>
                    <input
                        name="recruiterName"
                        value={profile.recruiterName}
                        onChange={handleChange}
                        placeholder="Sarah"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Difficulty Level
                    </label>
                    <select
                        name="difficulty"
                        value={profile.difficulty}
                        onChange={handleChange}
                    >
                        <option value="">Select Difficulty...</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Interview Type *
                    </label>
                    <select
                        name="interviewType"
                        value={profile.interviewType}
                        onChange={handleChange}
                    >
                        <option value="">Select Type...</option>
                        {INTERVIEW_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Candidate Name *
                    </label>
                    <input
                        name="candidateName"
                        value={profile.candidateName}
                        onChange={handleChange}
                        placeholder="John"
                    />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">
                        Job Description / Company Info (File)
                    </label>
                    <input
                        type="file"
                        accept=".txt,.md"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                    />
                    {profile.contextFile && (
                        <p className="file-upload-info">
                            <span>📄</span> File loaded ({profile.contextFile.length} chars)
                        </p>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Configuration'}
                </button>
                <button
                    onClick={handleReset}
                    disabled={loading}
                    style={{
                        background: 'var(--color-danger)',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    Reset to Default
                </button>
            </div>
        </div>
    );
};

export default ProfileEditor;
