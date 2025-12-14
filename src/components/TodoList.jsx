import React from 'react';
import { Trash2, Clock, CheckCircle, Circle } from 'lucide-react';

const TodoList = ({ items, onToggle, onDelete }) => {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-slate-500 opacity-50">
                <p>No tasks yet.</p>
                <p className="text-xs">Type or say "Buy milk at 5pm"</p>
            </div>
        );
    }

    return (
        <ul className="w-full space-y-3 px-2 pb-24 overflow-y-auto">
            {items.map((item) => (
                <li
                    key={item.id}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300
            ${item.done
                            ? 'bg-slate-800/50 opacity-60'
                            : 'bg-slate-800 border-l-4 border-cyan-500 shadow-md transform hover:translate-x-1'
                        }
          `}
                >
                    <button
                        onClick={() => onToggle(item.id, item.done)}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        {item.done ? <CheckCircle size={24} /> : <Circle size={24} />}
                    </button>

                    <div className="flex-1">
                        <p className={`font-medium text-lg ${item.done ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                            {item.title}
                        </p>
                        {item.date && (
                            <div className="flex items-center gap-1 text-xs text-cyan-400/80 mt-1">
                                <Clock size={12} />
                                <span>{new Date(item.date).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </li>
            ))}
        </ul>
    );
};

export default TodoList;
