import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, Trash2, Loader2, Sparkles } from 'lucide-react';
import geminiService from '../api/geminiService';
import { addChatMessage, getChatMessages, clearChatHistory } from '../lib/storage';
import { useLiveQuery } from 'dexie-react-hooks';

const ChatBot = () => {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    // Load messages from IndexedDB
    const messages = useLiveQuery(() => getChatMessages(), []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setIsLoading(true);

        try {
            // Save user message
            await addChatMessage('user', userMessage);

            // Get AI response
            const aiResponse = await geminiService.sendMessage(userMessage);

            // Save AI response
            await addChatMessage('assistant', aiResponse);

        } catch (error) {
            console.error('Chat error:', error);
            await addChatMessage('assistant', '⚠️ Sorry, something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = async () => {
        if (confirm('Clear all chat history? This cannot be undone.')) {
            await clearChatHistory();
            geminiService.clearHistory();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-lg border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                        <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">AI Assistant</h2>
                        <p className="text-xs text-slate-400">Powered by Gemini</p>
                    </div>
                </div>
                {messages && messages.length > 0 && (
                    <button
                        onClick={handleClearChat}
                        className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 transition-colors"
                    >
                        <Trash2 size={14} />
                        Clear
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!messages || messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full">
                            <Sparkles size={48} className="text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Welcome to AI Chat!</h3>
                            <p className="text-slate-400 text-sm max-w-md">
                                Ask me anything! I can help with questions, provide information,
                                have conversations, and assist you with various tasks.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                            {['What can you do?', 'Tell me a joke', 'Help me learn something new'].map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setInputValue(suggestion)}
                                    className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-purple-500/30 rounded-lg text-sm text-slate-300 transition-all hover:scale-105"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                    }`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`p-2 rounded-xl flex-shrink-0 ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-cyan-500 to-blue-500'
                                            : 'bg-gradient-to-br from-purple-500 to-pink-500'
                                        }`}
                                >
                                    {msg.role === 'user' ? (
                                        <User size={18} className="text-white" />
                                    ) : (
                                        <Bot size={18} className="text-white" />
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div
                                    className={`max-w-[75%] rounded-2xl p-4 ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/30 rounded-tr-none'
                                            : 'bg-slate-800/80 border border-slate-700/50 rounded-tl-none'
                                        }`}
                                >
                                    <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                                        {msg.text}
                                    </p>
                                    <span className="text-[10px] text-slate-500 mt-2 block">
                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                                    <Bot size={18} className="text-white" />
                                </div>
                                <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-none p-4">
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin text-purple-400" />
                                        <span className="text-sm text-slate-400">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={scrollRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900/80 backdrop-blur-xl border-t border-white/10">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isLoading ? "AI is thinking..." : "Type your message..."}
                        disabled={isLoading}
                        className="flex-1 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none placeholder:text-slate-500 transition-all disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white hover:scale-105 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatBot;
