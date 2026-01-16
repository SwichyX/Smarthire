import React, { useState, useEffect, useRef } from 'react';
import { ConversationEngine, Message } from '../services/ConversationEngine';
import { speechRecognition } from '../services/speechRecognition';
import { synthesizeSpeech } from '../services/tts';
import { loadProfile } from '../services/db';

interface ChatInterfaceProps {
    history: Message[];
    setHistory: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ history, setHistory }) => {
    const [engine, setEngine] = useState<ConversationEngine | null>(null);
    // history state lifted to App.tsx
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [configError, setConfigError] = useState<string | null>(null);
    const [lastInputMethod, setLastInputMethod] = useState<'keyboard' | 'voice'>('keyboard');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);

    useEffect(() => {
        // Load configuration from database and initialize engine
        const initEngine = async () => {
            try {
                const profile = await loadProfile();

                if (!profile) {
                    setConfigError('No recruiter configuration found. Please configure your profile first.');
                    return;
                }

                const conversationEngine = new ConversationEngine({
                    recruiterName: profile.recruiterName,
                    difficulty: profile.difficulty,
                    interviewType: profile.interviewType,
                    candidateName: profile.candidateName,
                    contextFile: profile.contextFile,
                }, history); // Initialize with existing history

                setEngine(conversationEngine);
                setConfigError(null);
            } catch (error) {
                console.error('Failed to load configuration:', error);
                setConfigError('Failed to load configuration. Please try again.');
            }
        };

        initEngine();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const playAudioResponse = async (text: string) => {
        try {
            const audio = await synthesizeSpeech(text);
            await audio.play();
        } catch (error) {
            console.error('Failed to play TTS:', error);
        }
    };


    const handleStart = async () => {
        if (!engine) return;
        setLoading(true);
        try {
            const response = await engine.startInterview();
            setHistory([...engine.getHistory()]);
            playAudioResponse(response);
        } catch (error: any) {
            console.error('Failed to start interview:', error);
            const errorMessage = error?.message || 'Error starting interview. Please check your API key configuration.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    const handleSend = async () => {
        if (!engine || !input.trim()) return;
        const userMessage = input;
        setInput('');
        setPendingTranscript(null); // Clear pending state
        setLoading(true);
        setLastInputMethod('keyboard'); // Track keyboard input

        try {
            const response = await engine.sendCandidateResponse(userMessage);
            // Get fresh history from engine
            const updatedHistory = engine.getHistory();
            setHistory([...updatedHistory]);

            // Only play TTS if last input was voice
            if (lastInputMethod === 'voice') {
                playAudioResponse(response);
            }
        } catch (error: any) {
            console.error('Failed to send message:', error);
            const errorMessage = error?.message || 'Error sending message. Please try again.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVoiceInput = () => {
        if (!speechRecognition.isSupported()) {
            alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        if (isRecording) {
            speechRecognition.stopListening();
            setIsRecording(false);
            return;
        }

        setIsRecording(true);
        setLastInputMethod('voice'); // Mark as voice input

        speechRecognition.startListening(
            async (transcript) => {
                setInput(transcript);
                setPendingTranscript(transcript); // Set pending transcript for confirmation
                setIsRecording(false);
            },
            (error) => {
                console.error('Speech recognition error:', error);
                alert(`Voice recognition error: ${error}`);
                setIsRecording(false);
            }
        );
    };

    const handleConfirmSend = () => {
        handleSend();
    };

    const handleCancelRecording = () => {
        setInput('');
        setPendingTranscript(null);
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3 style={{ margin: 0 }}>Live Interview</h3>
                {history.length === 0 && !loading && !configError && (
                    <button onClick={handleStart} disabled={!engine} style={{ fontSize: '0.9rem' }}>
                        Start Session
                    </button>
                )}
            </div>

            <div className="chat-messages">
                {configError && (
                    <div style={{
                        textAlign: 'center',
                        color: 'var(--color-danger)',
                        marginTop: '2rem',
                        padding: '2rem',
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--border-radius-lg)',
                        border: '1px solid var(--color-danger)'
                    }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>⚠️ Configuration Required</p>
                        <p>{configError}</p>
                        <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
                            Please go to <strong>Recruiter Profile</strong> tab and configure your interview settings.
                        </p>
                    </div>
                )}

                {!configError && history.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '2rem' }}>
                        <p>Ready to begin? Click "Start Session" to connect with the AI Recruiter.</p>
                    </div>
                )}

                {history.map((msg, index) => (
                    <div key={index} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', width: '100%', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div className={`message-bubble ${msg.role}`}>
                            {msg.parts}
                        </div>
                        <div className="message-label">
                            {msg.role === 'user' ? 'You' : 'Recruiter'}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area" style={{ alignItems: 'flex-start' }}>
                {pendingTranscript ? (
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center' }}>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            style={{ flex: 1, border: '2px solid var(--color-primary)' }}
                        />
                        <button
                            onClick={handleConfirmSend}
                            style={{ backgroundColor: 'var(--color-success)', minWidth: '80px' }}
                            title="Confirm and Send"
                        >
                            ✅ Send
                        </button>
                        <button
                            onClick={handleCancelRecording}
                            style={{ backgroundColor: 'var(--color-danger)', minWidth: '80px' }}
                            title="Cancel Recording"
                        >
                            ❌ Retry
                        </button>
                    </div>
                ) : (
                    <>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (!isRecording) handleSend();
                                }
                            }}
                            placeholder={isRecording ? "Listening..." : "Type your answer or use the microphone... (Shift+Enter for new line)"}
                            disabled={loading || history.length === 0 || isRecording}
                            style={{
                                flex: 1,
                                resize: 'vertical',
                                minHeight: '50px',
                                maxHeight: '200px',
                                padding: '0.8rem',
                                fontFamily: 'inherit',
                                fontSize: '1rem'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <button
                                onClick={handleVoiceInput}
                                disabled={loading || history.length === 0}
                                style={{
                                    backgroundColor: isRecording ? 'var(--color-danger)' : 'var(--color-success)',
                                    minWidth: '3rem',
                                    fontSize: '1.2rem',
                                    padding: '0.5rem',
                                    height: '50px'
                                }}
                                title={isRecording ? "Stop recording" : "Record voice answer"}
                            >
                                {isRecording ? '⏹️' : '🎤'}
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={loading || history.length === 0 || !input.trim()}
                                style={{ height: '50px' }}
                            >
                                Send
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatInterface;
