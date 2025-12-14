import React, { useRef, useEffect } from 'react';
import { Bot, User } from 'lucide-react';

const ChatInterface = ({ messages }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <div className="flex-1 w-full overflow-y-auto px-4 py-2 space-y-4 max-h-[40vh]">
            {messages.map((msg, index) => (
                <div
                    key={index}
                    className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                    <div className={`p-2 rounded-full ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`max-w-[80%] rounded-lg p-3 text-sm border 
            ${msg.role === 'user'
                            ? 'bg-indigo-900/50 border-indigo-700 text-indigo-100 rounded-tr-none'
                            : 'bg-slate-800/80 border-slate-700 text-slate-200 rounded-tl-none'
                        }`}>
                        <p>{msg.text}</p>
                        <span className="text-[10px] opacity-50 mt-1 block w-full text-right">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            ))}
            <div ref={scrollRef} />
        </div>
    );
};

export default ChatInterface;
