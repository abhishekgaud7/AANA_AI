import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Send, Camera, Download } from 'lucide-react'
import VisualAvatar from './components/VisualAvatar'
import ChatInterface from './components/ChatInterface'
import { useSpeech } from './hooks/useSpeech'
import { processCommand } from './lib/nlp'
import { addReminder, addNote, saveFact, getFact, getPendingReminders, db } from './lib/storage'
import { identifyImage } from './lib/vision'

function App() {
    const [messages, setMessages] = useState([]);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [processing, setProcessing] = useState(false);
    const [installPrompt, setInstallPrompt] = useState(null);

    // Vision State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);

    const { isListening, isSpeaking, transcript, turnOnMicrophone, speak, stopSpeaking } = useSpeech();

    // PWA Install Prompt Capture
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    // Offline Detection
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Check reminders periodically
    useEffect(() => {
        const interval = setInterval(async () => {
            const pending = await getPendingReminders();
            const now = new Date();

            pending.forEach(reminder => {
                if (reminder.date) {
                    const reminderTime = new Date(reminder.date).getTime();
                    if (reminderTime <= now.getTime()) {
                        speak(`Reminder: ${reminder.title}`);
                        if (Notification.permission === 'granted') {
                            new Notification("Jarvis Reminder", {
                                body: reminder.title,
                                icon: '/pwa-192x192.png'
                            });
                        }
                        db.reminders.update(reminder.id, { done: 1 });
                        addMessage(`Reminder: ${reminder.title}`, 'bot');
                    }
                }
            });
        }, 10000);
        return () => clearInterval(interval);
    }, [speak]);

    // Request Notification permission
    useEffect(() => {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }, []);

    // Handle Speech Transcript
    useEffect(() => {
        if (!isListening && transcript && !processing) {
            handleCommand(transcript);
        }
    }, [isListening, transcript]);

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    setInstallPrompt(null);
                }
            });
        }
    };

    const toggleCamera = async () => {
        if (isCameraOpen) {
            const stream = videoRef.current.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            videoRef.current.srcObject = null;
            setIsCameraOpen(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                videoRef.current.srcObject = stream;
                setIsCameraOpen(true);
            } catch (e) {
                addMessage("Could not access camera.", "bot");
            }
        }
    };

    const analyzeView = async () => {
        if (!isCameraOpen || !videoRef.current) {
            speak("My eyes are closed. Open the camera first.");
            return;
        }
        speak("Let me take a look...");
        addMessage("Analyzing image...", "bot");

        const result = await identifyImage(videoRef.current);
        const response = `I see a ${result}`;

        addMessage(response, "bot");
        speak(response);
    };

    const addMessage = (text, role) => {
        setMessages(prev => [...prev, { text, role, timestamp: new Date() }]);
    };

    const handleCommand = async (text) => {
        setProcessing(true);
        addMessage(text, 'user');

        // Quick check for vision context
        if ((text.toLowerCase().includes('what is this') || text.toLowerCase().includes('what do you see')) && isCameraOpen) {
            await analyzeView();
            setProcessing(false);
            return;
        }

        // Process NLP
        const { intent, entities } = processCommand(text);
        console.log("Intent:", intent, entities);

        let responseText = "I didn't quite catch that.";

        try {
            switch (intent) {
                case 'SET_REMINDER':
                    if (entities.content) {
                        await addReminder(entities.content, entities.time || new Date());
                        responseText = `Okay, I've set a reminder to ${entities.content} ${entities.time ? 'at ' + entities.time : ''}`;
                    } else {
                        responseText = "What should I remind you about?";
                    }
                    break;
                case 'ADD_NOTE':
                    if (entities.content) {
                        await addNote(entities.content);
                        responseText = "Note saved.";
                    }
                    break;
                case 'STORE_FACT':
                    if (entities.key && entities.value) {
                        await saveFact(entities.key, entities.value);
                        responseText = `Okay, I'll remember that your name is ${entities.value}.`;
                    }
                    break;
                case 'QUERY_FACT':
                    const fact = await getFact(entities.key);
                    if (fact) {
                        responseText = `Your name is ${fact}.`;
                    } else {
                        responseText = "I don't know that yet.";
                    }
                    break;
                case 'CALCULATE':
                    if (entities.expression) {
                        try {
                            // eslint-disable-next-line no-eval
                            const result = eval(entities.expression);
                            responseText = `The result is ${result}`;
                        } catch (e) {
                            responseText = "I couldn't calculate that.";
                        }
                    }
                    break;
                case 'get_time':
                    responseText = `It is currently ${new Date().toLocaleTimeString()}`;
                    break;
                case 'OPEN_URL':
                    window.open(entities.url, '_blank');
                    responseText = "Opening browser.";
                    break;
                default:
                    responseText = "I'm not sure how to help with that yet.";
            }
        } catch (e) {
            console.error(e);
            responseText = "Sorry, I encountered an error accessing my memory.";
        }

        addMessage(responseText, 'bot');
        speak(responseText);
        setTimeout(() => setProcessing(false), 1000);
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-radial-gradient from-slate-800 to-slate-950 -z-10 opacity-50" />

            {isOffline && (
                <div className="absolute top-0 w-full bg-yellow-600/90 backdrop-blur-sm text-center text-xs py-1 z-50">
                    Offline Mode Active
                </div>
            )}

            {/* Header */}
            <header className="w-full p-4 flex justify-between items-center bg-slate-900/50 backdrop-blur-md border-b border-white/5 z-20">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-mono text-sm tracking-widest text-cyan-400">JARVIS.OS</span>
                </div>
                <div className="flex items-center gap-3">
                    {installPrompt && (
                        <button onClick={handleInstallClick} className="flex items-center gap-1 text-xs bg-cyan-900/50 hover:bg-cyan-800 px-3 py-1 rounded border border-cyan-500/30 transition-all">
                            <Download size={14} /> Install App
                        </button>
                    )}
                    <div className="text-xs text-slate-500 font-mono">
                        {new Date().toLocaleDateString()}
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-between w-full max-w-lg p-6 relative z-10">

                {/* Camera Overlay */}
                <div className={`transition-all duration-500 overflow-hidden w-full ${isCameraOpen ? 'max-h-64 mb-4 border border-cyan-500/50 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'max-h-0'}`}>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-black" />
                </div>

                {/* Messages scroll area */}
                <ChatInterface messages={messages} />

                {/* Avatar Centerpiece */}
                {!isCameraOpen && (
                    <div className="my-8">
                        <VisualAvatar isListening={isListening} isSpeaking={isSpeaking} />
                    </div>
                )}

                {/* Input/Status Controls */}
                <div className="w-full flex flex-col items-center gap-4">
                    <div className="flex gap-4 items-center">
                        {/* Camera Button */}
                        <button
                            onClick={toggleCamera}
                            className={`p-4 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 border border-slate-700
                      ${isCameraOpen ? 'bg-cyan-900/80 text-cyan-400 shadow-lg' : 'bg-slate-800 text-slate-400'}
                  `}
                        >
                            <Camera size={24} />
                        </button>

                        {/* Mic Button */}
                        <button
                            onClick={isListening ? null : turnOnMicrophone}
                            className={`p-6 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95
                       ${isListening
                                    ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse'
                                    : 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]'
                                }
                   `}
                        >
                            {isListening ? <MicOff className="text-white" size={32} /> : <Mic className="text-white" size={32} />}
                        </button>
                    </div>

                    <p className="text-slate-500 text-xs mt-2">{isCameraOpen ? "Tap Mic & ask 'What is this?'" : "Tap to Speak"}</p>
                </div>
            </main>
        </div>
    )
}

export default App
