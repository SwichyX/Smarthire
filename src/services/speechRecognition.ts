// Speech-to-Text service using Web Speech API
export class SpeechRecognitionService {
    private recognition: any;
    private isListening: boolean = false;

    constructor() {
        // Check if browser supports Web Speech API
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'it-IT'; // Italian language
    }

    isSupported(): boolean {
        return !!this.recognition;
    }

    startListening(
        onResult: (transcript: string) => void,
        onError?: (error: string) => void
    ): void {
        if (!this.recognition) {
            onError?.('Speech recognition not supported');
            return;
        }

        if (this.isListening) {
            return;
        }

        this.isListening = true;

        this.recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
            this.isListening = false;
        };

        this.recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            onError?.(event.error);
            this.isListening = false;
        };

        this.recognition.onend = () => {
            this.isListening = false;
        };

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.isListening = false;
            onError?.('Failed to start recording');
        }
    }

    stopListening(): void {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    getIsListening(): boolean {
        return this.isListening;
    }
}

export const speechRecognition = new SpeechRecognitionService();
