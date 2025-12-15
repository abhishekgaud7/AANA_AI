import React, { useEffect } from 'react';
import { Bell, X } from 'lucide-react';

const ReminderAlert = ({ reminder, onClose }) => {
    useEffect(() => {
        // Auto-close after 10 seconds
        const timer = setTimeout(() => {
            onClose();
        }, 10000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-slideUp border-4 border-white/20">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-full animate-bounce">
                            <Bell size={28} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Reminder!</h3>
                            <p className="text-xs text-white/80">Time's up</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} className="text-white" />
                    </button>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                    <p className="text-white text-lg font-medium">{reminder.title}</p>
                    {reminder.date && (
                        <p className="text-white/70 text-sm mt-2">
                            Scheduled for: {new Date(reminder.date).toLocaleString()}
                        </p>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-white text-cyan-600 font-semibold py-3 rounded-xl hover:bg-white/90 transition-all transform hover:scale-105"
                >
                    Got it!
                </button>
            </div>
        </div>
    );
};

export default ReminderAlert;
