
import React from 'react';
import { audioService } from '../services/audioService';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'gold';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  onClick,
  ...props 
}) => {
  const baseStyle = "relative px-6 py-3 rounded-lg font-bold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg overflow-hidden group";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-500/30",
    danger: "bg-red-600 hover:bg-red-500 text-white border border-red-400/30",
    gold: "bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-white border border-yellow-300/50 shadow-yellow-900/50",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Initialize audio context on first user interaction if needed
    audioService.initAudio(); 
    audioService.playClick();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      onClick={handleClick}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading && (
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </span>
      {/* Shine effect */}
      <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
    </button>
  );
};
