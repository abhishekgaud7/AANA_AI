import React, { useState, useEffect } from 'react'
import { Mic, MicOff, Download, Plus, Trash2, CheckCheck, Search, Cloud, Sun, CloudRain, Wind, Bell, Clock } from 'lucide-react'
import TodoList from './components/TodoList'
import ReminderAlert from './components/ReminderAlert'
import ParticleBackground from './components/ParticleBackground'
import ProgressRing from './components/ProgressRing'
import { useSpeech } from './hooks/useSpeech'
import { processCommand } from './lib/nlp'
import { addTask, getTasks, updateTaskStatus, deleteTask, getPendingReminders, markAsNotified, db } from './lib/storage'
import taskService from './api/taskService'
import { useLiveQuery } from 'dexie-react-hooks'

function App() {
    const [inputValue, setInputValue] = useState("");
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [installPrompt, setInstallPrompt] = useState(null);
    const [activeReminder, setActiveReminder] = useState(null);
    const [useMySQL, setUseMySQL] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [reminderTime, setReminderTime] = useState(''); // For time picker
    const [showTimeConfirm, setShowTimeConfirm] = useState(false); // Show confirmation

    // Fallback to Dexie if MySQL not available
    const dexieTasks = useLiveQuery(() => db.reminders.toArray().then(rows =>
        rows.sort((a, b) => a.done - b.done || b.id - a.id)
    ));

    const { isListening, transcript, turnOnMicrophone, speak, error: speechError } = useSpeech();

    // Check MySQL availability on mount
    useEffect(() => {
        async function checkBackend() {
            const isHealthy = await taskService.checkHealth();
            setUseMySQL(isHealthy);
            if (isHealthy) {
                await loadTasksFromMySQL();
            }
            setLoading(false);
        }
        checkBackend();
    }, []);

    // Use MySQL tasks if available, otherwise Dexie
    useEffect(() => {
        if (!useMySQL && dexieTasks) {
            setTasks(dexieTasks);
        }
    }, [useMySQL, dexieTasks]);

    // Load tasks from MySQL
    const loadTasksFromMySQL = async () => {
        try {
            const data = await taskService.getAllTasks();
            setTasks(data);
        } catch (error) {
            console.error('Failed to load from MySQL, falling back to Dexie');
            setUseMySQL(false);
        }
    };

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
        const handleOnline = () => {
            setIsOffline(false);
            // Retry MySQL connection when back online
            taskService.checkHealth().then(healthy => {
                if (healthy) {
                    setUseMySQL(true);
                    loadTasksFromMySQL();
                }
            });
        };
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
            let pending = [];

            if (useMySQL) {
                try {
                    pending = await taskService.getPendingReminders();
                } catch (error) {
                    pending = await getPendingReminders();
                }
            } else {
                pending = await getPendingReminders();
            }

            const now = new Date();
            console.log(`\n🔔 [${now.toLocaleTimeString()}] Checking ${pending.length} reminders...`);

            // Use for loop instead of forEach to properly await async operations
            for (const reminder of pending) {
                if (reminder.date && !reminder.notified) {
                    const reminderTime = new Date(reminder.date);
                    const timeDiff = now.getTime() - reminderTime.getTime();

                    console.log(`  📌 "${reminder.title}"`);
                    console.log(`     Scheduled: ${reminderTime.toLocaleString()}`);
                    console.log(`     Current:   ${now.toLocaleString()}`);
                    console.log(`     Time diff: ${Math.round(timeDiff / 1000)}s`);
                    console.log(`     Notified:  ${reminder.notified ? 'Yes' : 'No'}`);

                    if (timeDiff >= 0 && timeDiff <= 300000) {
                        console.log(`     ✅ TRIGGERING REMINDER!`);

                        // Mark as notified
                        if (useMySQL) {
                            try {
                                await taskService.updateTask(reminder.id, { notified: 1 });
                            } catch (error) {
                                await markAsNotified(reminder.id);
                            }
                        } else {
                            await markAsNotified(reminder.id);
                        }

                        setActiveReminder(reminder);
                        speak(`Reminder: ${reminder.title}`);

                        if (Notification.permission === 'granted') {
                            new Notification("⏰ Reminder!", {
                                body: reminder.title,
                                icon: '/pwa-192x192.png',
                                badge: '/pwa-192x192.png',
                                tag: `reminder-${reminder.id}`,
                                requireInteraction: true,
                                vibrate: [200, 100, 200]
                            });
                            console.log(`     📬 Browser notification sent`);
                        }

                        console.log(`     ✅✅✅ REMINDER COMPLETE!\n`);
                    } else if (timeDiff < 0) {
                        console.log(`     ⏳ Not yet (${Math.abs(diffSeconds)}s remaining)`);
                    } else {
                        console.log(`     ⏰ Too late (${diffSeconds}s ago, >10min)`);
                    }
                }
            } // end for loop
        }, 2000); // Check every 2 seconds!
        return () => clearInterval(interval);
    }, [speak, useMySQL]);

    // Request Notification permission - AGGRESSIVE
    useEffect(() => {
        const requestPermission = async () => {
            if ('Notification' in window) {
                console.log('🔔 Notification API available');
                console.log('🔔 Current permission:', Notification.permission);

                if (Notification.permission === 'default') {
                    console.log('🔔 Requesting notification permission...');
                    const permission = await Notification.requestPermission();
                    console.log('🔔 Permission result:', permission);

                    if (permission === 'granted') {
                        console.log('✅ Notifications ENABLED!');
                        // Show test notification
                        new Notification('🎉 PA_Aana Notifications Enabled!', {
                            body: 'You will now receive reminder popups',
                            icon: '/pwa-192x192.png'
                        });
                    } else {
                        console.log('❌ Notifications DENIED');
                        alert('⚠️ Please enable notifications to receive reminders!\n\nClick the 🔔 icon in your browser address bar.');
                    }
                } else if (Notification.permission === 'granted') {
                    console.log('✅ Notifications already enabled');
                } else {
                    console.log('❌ Notifications denied');
                }
            } else {
                console.log('❌ Notification API not supported');
            }
        };

        // Request permission after 2 seconds
        setTimeout(requestPermission, 2000);
    }, []);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
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
        const { entities } = processCommand(text);
        const title = entities.content || text;
        let date = entities.time || reminderTime || null;

        // If time picker is used, convert to ISO
        if (reminderTime && !entities.time) {
            date = new Date(reminderTime).toISOString();
        }

        if (useMySQL) {
            try {
                await taskService.createTask(title, date);
                await loadTasksFromMySQL();
            } catch (error) {
                console.error('MySQL failed, using Dexie');
                await addTask(title, date);
            }
        } else {
            await addTask(title, date);
        }

        setInputValue("");
        setReminderTime(""); // Clear time picker

        // Show confirmation
        if (date) {
            const reminderDate = new Date(date);
            setShowTimeConfirm(true);
            speak(`Reminder set for ${reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

            // Hide confirmation after 3 seconds
            setTimeout(() => setShowTimeConfirm(false), 3000);
        }
    };

    const handleToggle = async (id, done) => {
        if (useMySQL) {
            try {
                await taskService.updateTask(id, { done: done ? 0 : 1 });
                await loadTasksFromMySQL();
            } catch (error) {
                await updateTaskStatus(id, !done);
            }
        } else {
            await updateTaskStatus(id, !done);
        }
    };

    const handleDelete = async (id) => {
        if (useMySQL) {
            try {
                await taskService.deleteTask(id);
                await loadTasksFromMySQL();
            } catch (error) {
                await deleteTask(id);
            }
        } else {
            await deleteTask(id);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        handleInput(inputValue);
    };

    const handleClearCompleted = async () => {
        const completedTasks = tasks.filter(t => t.done);
        for (const task of completedTasks) {
            await handleDelete(task.id);
        }
    };

    const handleDeleteAll = async () => {
        if (confirm('Delete all tasks? This cannot be undone.')) {
            for (const task of tasks) {
                await handleDelete(task.id);
            }
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden font-sans">

            {/* Particle Background */}
            <ParticleBackground />

            {/* Status Indicators */}
            {isOffline && (
                <div className="absolute top-0 w-full bg-yellow-600/90 backdrop-blur-sm text-center text-xs py-1 z-50">
                    ⚠️ Offline Mode
                </div>
            )}

            {!useMySQL && !isOffline && (
                <div className="absolute top-0 w-full bg-orange-600/90 backdrop-blur-sm text-center text-xs py-1 z-50">
                    💾 Using Local Storage (MySQL unavailable)
                </div>
            )}

            {useMySQL && (
                <div className="absolute top-0 w-full bg-green-600/90 backdrop-blur-sm text-center text-xs py-1 z-50">
                    ✅ Connected to MySQL
                </div>
            )}

            {speechError && (
                <div className="absolute top-8 w-full bg-red-600/90 backdrop-blur-sm text-center text-xs py-1 z-50 animate-bounce">
                    {speechError}
                </div>
            )}

            {/* Header with Progress */}
            <header className="w-full p-4 bg-slate-900/50 backdrop-blur-lg border-b border-white/10 z-20 shadow-2xl">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                                PA_Aana
                            </h1>
                            <span className="text-xs text-slate-400">
                                {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        <div className="flex flex-col items-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-purple-500/30">
                            <div className="text-2xl font-bold text-white">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-purple-300">
                                {currentTime.toLocaleTimeString([], { second: '2-digit' })}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {tasks && tasks.length > 0 && (
                            <div className="flex flex-col text-right">
                                <div className="text-sm text-slate-300">
                                    {tasks.filter(t => t.done).length} / {tasks.length} completed
                                </div>
                                <div className="text-xs text-slate-500">
                                    {tasks.filter(t => !t.done && t.date).length} pending reminders
                                </div>
                            </div>
                        )}
                        {tasks && tasks.length > 0 && <ProgressRing tasks={tasks} />}
                        {installPrompt && (
                            <button
                                onClick={handleInstallClick}
                                className="flex items-center gap-1 text-xs bg-cyan-900/50 hover:bg-cyan-800 px-3 py-2 rounded-lg border border-cyan-500/30 transition-all hover:scale-105"
                            >
                                <Download size={14} /> Install
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* List Area */}
            <main className="flex-1 w-full max-w-4xl mx-auto relative z-10 p-4 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
                    </div>
                ) : (
                    <TodoList
                        items={tasks || []}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                    />
                )}
            </main>

            {/* Input Area (Bottom Fixed) */}
            <div className="w-full bg-slate-900/80 backdrop-blur-xl border-t border-white/10 p-4 z-50 pb-8 shadow-2xl">
                {/* Time Confirmation Toast */}
                {showTimeConfirm && (
                    <div className="max-w-4xl mx-auto mb-3">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                            <span className="text-xl">✅</span>
                            <span className="font-medium">Reminder set! Popup will appear at scheduled time.</span>
                        </div>
                    </div>
                )}

                <div className="max-w-4xl mx-auto">
                    {/* Time Picker Row */}
                    <div className="flex gap-2 mb-3 items-center">
                        <label className="text-sm text-purple-300 flex items-center gap-2">
                            <Clock size={16} />
                            Set Reminder Time:
                        </label>
                        <input
                            type="datetime-local"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="bg-slate-800/80 border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                        {reminderTime && (
                            <button
                                onClick={() => setReminderTime('')}
                                className="text-xs text-slate-400 hover:text-white"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Input Row */}
                    <div className="flex gap-3 items-center">
                        <button
                            onClick={turnOnMicrophone}
                            className={`p-3 rounded-full transition-all shadow-lg ${isListening
                                ? 'bg-red-500 animate-pulse shadow-red-500/50'
                                : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:scale-110 shadow-cyan-500/50'
                                }`}
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>

                        <form onSubmit={handleSubmit} className="flex-1 flex gap-3">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={isListening ? "🎤 Listening..." : "Add a task (e.g., 'Call Mom at 5pm')"}
                                className="flex-1 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none placeholder:text-slate-500 transition-all"
                            />
                            <button
                                type="submit"
                                className="p-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-white hover:scale-105 transition-all shadow-lg shadow-cyan-500/30"
                            >
                                <Plus size={20} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* On-Screen Reminder Alert */}
                {activeReminder && (
                    <ReminderAlert
                        reminder={activeReminder}
                        onClose={() => setActiveReminder(null)}
                    />
                )}

            </div>
        </div>
        </div>
    )
}

export default App
