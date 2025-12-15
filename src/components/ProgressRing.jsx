import React from 'react';
import { motion } from 'framer-motion';

const ProgressRing = ({ tasks = [] }) => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.done).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex items-center gap-3">
            <div className="relative w-24 h-24">
                <svg className="transform -rotate-90 w-24 h-24">
                    {/* Background circle */}
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="8"
                        fill="none"
                    />
                    {/* Progress circle */}
                    <motion.circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: 'easeInOut' }}
                    />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="50%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#f472b6" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{percentage}%</div>
                        <div className="text-xs text-slate-400">Done</div>
                    </div>
                </div>
            </div>
            <div className="text-sm">
                <div className="text-white font-medium">{completed} of {total}</div>
                <div className="text-slate-400">tasks completed</div>
            </div>
        </div>
    );
};

export default ProgressRing;
