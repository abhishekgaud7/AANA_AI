import React from 'react';
import { Trash2, Clock, CheckCircle, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const TodoList = ({ items, onToggle, onDelete }) => {
    const handleToggle = (item) => {
        // Trigger confetti if marking as done
        if (!item.done) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#a855f7', '#ec4899', '#f472b6', '#d946ef', '#c026d3', '#f9a8d4']
            });
        }
        onToggle(item.id, item.done);
    };

    if (items.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center p-8 text-slate-500 opacity-50"
            >
                <p className="text-lg">No tasks yet.</p>
                <p className="text-xs mt-2">Type or say "Buy milk at 5pm"</p>
            </motion.div>
        );
    }

    return (
        <ul className="w-full space-y-3 px-2 pb-24 overflow-y-auto">
            <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                    <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                            delay: index * 0.05
                        }}
                        className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 backdrop-blur-sm
                            ${item.done
                                ? 'bg-slate-800/30 opacity-60'
                                : 'bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-l-4 border-purple-500 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20'
                            }
                        `}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <motion.button
                            onClick={() => handleToggle(item)}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {item.done ? <CheckCircle size={24} /> : <Circle size={24} />}
                        </motion.button>

                        <div className="flex-1">
                            <p className={`font-medium text-lg ${item.done ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                                {item.title}
                            </p>
                            {item.date && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-1 text-xs text-purple-400/80 mt-1"
                                >
                                    <Clock size={12} />
                                    <span>{new Date(item.date).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                </motion.div>
                            )}
                        </div>

                        <motion.button
                            onClick={() => onDelete(item.id)}
                            className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                            whileHover={{ scale: 1.2, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Trash2 size={18} />
                        </motion.button>
                    </motion.li>
                ))}
            </AnimatePresence>
        </ul>
    );
};

export default TodoList;
