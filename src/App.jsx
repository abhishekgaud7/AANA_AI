import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Download, Plus, Search } from 'lucide-react'
import TodoList from './components/TodoList'
import { useSpeech } from './hooks/useSpeech'
import { processCommand } from './lib/nlp'
import { addTask, getTasks, updateTaskStatus, deleteTask, getPendingReminders, db } from './lib/storage'
import { useLiveQuery } from 'dexie-react-hooks'

function App() {
    const [inputValue, setInputValue] = useState("");
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [installPrompt, setInstallPrompt] = useState(null);

    // Real-time list update from Dexie
    const tasks = useLiveQuery(() => db.reminders.toArray().then(rows =>
        // Sort: Pending first, then by date logic? 
        // Simple: Newest first? Or Pending first?
        // Let's sort: Undone first, then by ID (created/time)
        rows.sort((a, b) => a.done - b.done || b.id - a.id)
    ));

    const { isListening, isSpeaking, transcript, turnOnMicrophone, speak, error: speechError } = useSpeech();

    // Install Prompt
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    // Offline Check
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

    // Background Reminder Check
    useEffect(() => {
        const interval = setInterval(async () => {
            const pending = await getPendingReminders();
            const now = new Date();

            pending.forEach(reminder => {
                if (reminder.date) {
                    const reminderTime = new Date(reminder.date).getTime();
                    // Trigger if time matches minute (simple debounce via done check in app flow)
                    // Or just if passed.
                    // To avoid spamming, we mark done. But for a Todo list, marking done automatically might be annoying if user didn't do it.
                    // BUT, user asked for "Reminder". A reminder alerts you.
                    // We will Alert, but maybe NOT mark done visually in the list? Or mark as "Exceeded"?
                    // Simplest: Speak alert, show Notification. User manually checks box.
                    // To prevent repeating, we need a 'notified' flag.
                    // For MVP, checking status < now && !notified is complex without DB schema update.
                    // Let's Stick to: Speak + Notification. Debounce by storing 'lastNotified' in memory or localstorage?
                    // Or just mark done in DB if user wanted "Remind me to call mom". Usually implies one-time.

                    // User said "To Do List". Usually you check it off.
                    // Compromise: Notification fires, we DON'T auto-check. 
                    // We need to avoid infinite loop. 
                    // Let's ignore for now or assume strict equality? Strict equality is flaky.
                    // We will SKIP auto-update for now to avoid mess, just rely on visual list.
                    // Wait, user explicitly asked for "Reminder" feature.
                    // Implies: It needs to ring.

                    if (reminderTime <= now.getTime() && reminderTime > now.getTime() - 60000) {
                        // Only trigger within the exact minute it became due
                        speak(`Time to: ${reminder.title}`);
                        if (Notification.permission === 'granted') {
                            new Notification("Time's Up!", {
                                body: reminder.title,
                                icon: '/pwa-192x192.png'
                            });
                        }
                    }
                }
            });
        }, 15000);
        return () => clearInterval(interval);
    }, [speak]);

    // Request Notification permission
    useEffect(() => {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }, []);

    // Handle Voice Input
    useEffect(() => {
        if (!isListening && transcript) {
            handleInput(transcript);
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

    const handleInput = async (text) => {
        // Process NLP to extract time
        const { entities } = processCommand(text);
        const title = entities.content || text; // Content found or raw text
        const date = entities.time || null;

        await addTask(title, date);
        setInputValue("");

        // Feedback
        if (date) {
            speak(`Added task for ${new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        } else {
            // Silent add or brief chirp? Silent is better for lists.
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        handleInput(inputValue);
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-950 text-white relative overflow-hidden font-sans">

            {isOffline && (
                <div className="absolute top-0 w-full bg-yellow-600/90 backdrop-blur-sm text-center text-xs py-1 z-50">
                    Offline
                </div>
            )}

            {speechError && (
                <div className="absolute top-8 w-full bg-red-600/90 backdrop-blur-sm text-center text-xs py-1 z-50 animate-bounce">
                    {speechError}
                </div>
            )}

            {/* Header */}
            <header className="w-full p-4 flex justify-between items-center bg-slate-900 border-b border-white/5 z-20 shadow-lg">
                <div className="flex items-col flex-col">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Tasks</h1>
                    <span className="text-xs text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3">
                    {installPrompt && (
                        <button onClick={handleInstallClick} className="flex items-center gap-1 text-xs bg-cyan-900/50 hover:bg-cyan-800 px-3 py-1 rounded border border-cyan-500/30 transition-all">
                            <Download size={14} /> Install
                        </button>
                    )}
                </div>
            </header>

            {/* List Area */}
            <main className="flex-1 w-full max-w-lg mx-auto relative z-10 p-2">
                <TodoList
                    items={tasks || []}
                    onToggle={(id, done) => updateTaskStatus(id, !done)}
                    onDelete={deleteTask}
                />
            </main>

            {/* Input Area (Bottom Fixed) */}
            <div className="w-full bg-slate-900/80 backdrop-blur-lg border-t border-white/5 p-4 z-50 pb-8">
                <div className="max-w-lg mx-auto flex gap-2 items-center">
                    <button
                        onClick={turnOnMicrophone}
                        className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-800 text-cyan-400 border border-slate-700'}`}
                    >
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Add a task (e.g., 'Call Mom at 5pm')"}
                            className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none placeholder:text-slate-600"
                        />
                        <button type="submit" className="p-3 bg-cyan-600 rounded-xl text-white hover:bg-cyan-500 transition-colors">
                            <Plus size={20} />
                        </button>
                    </form>
                </div>
            </div>

        </div>
    )
}

export default App
