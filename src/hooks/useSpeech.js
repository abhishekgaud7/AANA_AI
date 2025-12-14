import { useState, useEffect, useRef } from 'react';

export const useSpeech = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false; // Stop after one command usually better for "turn based"
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event) => {
                console.error("Speech error", event.error);
                setError(`Mic Error: ${event.error}`);
                setIsListening(false);
            };
            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                setError(null);
            };

            recognitionRef.current = recognition;
        } else {
            setError("Voice features not supported in this browser. Try Chrome/Edge.");
        }
    }, []);

    const turnOnMicrophone = () => {
        if (!recognitionRef.current) {
            setError("Voice features not supported.");
            return;
        }
        if (!isListening) {
            try {
                recognitionRef.current.start();
                setError(null);
            } catch (e) {
                console.error("Mic error:", e);
                setError("Could not start microphone.");
            }
        }
    };

    const speak = (text) => {
        if (!synthesisRef.current) return;

        // Stop any current speech
        synthesisRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => console.error("TTS Error", e);

        // Optional: Select a better voice
        const voices = synthesisRef.current.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
        if (preferredVoice) utterance.voice = preferredVoice;

        synthesisRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        if (synthesisRef.current) {
            synthesisRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    return {
        isListening,
        transcript,
        isSpeaking,
        error,
        turnOnMicrophone,
        speak,
        stopSpeaking
    };
};
