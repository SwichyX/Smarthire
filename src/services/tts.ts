/**
 * Service for Google Cloud Text-to-Speech.
 * Uses the REST API to synthesize speech from text.
 */

// We use the same key if possible, or the user might need to add a specific one.
// For simplicity, we'll try to use the VITE_GEMINI_API_KEY, but usually TTS needs a Google Cloud Project Key.
// We will check for VITE_GOOGLE_CLOUD_API_KEY first, then fall back or warn.
const API_KEY = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

export async function synthesizeSpeech(text: string): Promise<HTMLAudioElement> {
    if (!API_KEY) {
        throw new Error('API Key for TTS is missing.');
    }

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

    const requestBody = {
        input: { text },
        voice: { languageCode: 'it-IT', name: 'it-IT-Neural2-A' }, // Using a high-quality Italian voice
        audioConfig: { audioEncoding: 'MP3' },
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`TTS API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const audioContent = data.audioContent;

        if (!audioContent) {
            throw new Error('No audio content received from TTS API.');
        }

        const audioSrc = `data:audio/mp3;base64,${audioContent}`;
        const audio = new Audio(audioSrc);
        return audio;
    } catch (error) {
        console.error('Error synthesizing speech:', error);
        throw error;
    }
}
