import React from 'react';

const VisualAvatar = ({ isListening, isSpeaking }) => {
    return (
        <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500
      ${isListening ? 'bg-red-900/20 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]' : ''}
      ${isSpeaking ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.5)]' : ''}
      ${!isListening && !isSpeaking ? 'bg-slate-800 border-slate-600' : ''}
      border-2
    `}>
            {/* Core */}
            <div className={`w-32 h-32 rounded-full flex items-center justify-center bg-slate-900 z-10 
         ${isSpeaking ? 'animate-pulse' : ''}
      `}>
                {isSpeaking && (
                    <div className="flex gap-1 h-8 items-center">
                        <div className="w-1 bg-cyan-400 h-4 animate-wave"></div>
                        <div className="w-1 bg-cyan-400 h-8 animate-wave-slow"></div>
                        <div className="w-1 bg-cyan-400 h-6 animate-wave"></div>
                        <div className="w-1 bg-cyan-400 h-3 animate-wave-slow"></div>
                    </div>
                )}

                {isListening && (
                    <div className="w-8 h-8 rounded-full bg-red-500 animate-ping"></div>
                )}

                {!isListening && !isSpeaking && (
                    <div className="text-slate-500 text-xs">IDLE</div>
                )}
            </div>

            {/* Orbital Rings - Decorative */}
            <div className={`absolute inset-0 rounded-full border border-slate-700 w-full h-full animate-[spin_10s_linear_infinite] opacity-30 ${isListening ? 'border-red-500' : ''}`}></div>
            <div className="absolute inset-2 rounded-full border border-slate-700 w-[90%] h-[90%] animate-[spin_7s_linear_infinite_reverse] opacity-20"></div>

        </div>
    );
};

export default VisualAvatar;
