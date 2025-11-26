
import React from 'react';
import { Difficulty } from '../types';
import { Button } from './Button';
import { audioService } from '../services/audioService';

interface MainMenuProps {
  onStartGame: (difficulty: Difficulty) => void;
  onShowLeaderboard: () => void;
  onShowHistory: () => void;
  isLoading: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onShowLeaderboard, onShowHistory, isLoading }) => {
  
  const handleStart = (difficulty: Difficulty) => {
    audioService.playGameStart();
    onStartGame(difficulty);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto relative z-10 px-4">
      
      {/* Title Section */}
      <div className="text-center mb-12 relative group cursor-default">
        <h1 className="text-6xl md:text-8xl font-display gold-text drop-shadow-2xl mb-4">
          金魚大師
        </h1>
        <p className="text-xl md:text-2xl text-blue-200 tracking-widest font-light">
          一秒變專家，還是三秒就忘記？
        </p>
      </div>

      {/* Menu Card */}
      <div className="glass-panel p-8 md:p-12 rounded-3xl w-full flex flex-col gap-6 shadow-2xl border-t border-white/10">
        <h2 className="text-2xl text-center font-bold text-white mb-4">選擇挑戰難度</h2>
        
        <div className="grid gap-4">
          <Button 
            variant="primary" 
            onClick={() => handleStart(Difficulty.EASY)}
            isLoading={isLoading}
            className="w-full text-lg py-4 border-l-4 border-l-green-400"
          >
            {Difficulty.EASY} (輕鬆養魚)
          </Button>
          
          <Button 
            variant="primary" 
            onClick={() => handleStart(Difficulty.MEDIUM)}
            isLoading={isLoading}
            className="w-full text-lg py-4 border-l-4 border-l-yellow-400"
          >
            {Difficulty.MEDIUM} (水族老手)
          </Button>
          
          <Button 
            variant="primary" 
            onClick={() => handleStart(Difficulty.HARD)}
            isLoading={isLoading}
            className="w-full text-lg py-4 border-l-4 border-l-red-600"
          >
            {Difficulty.HARD} (金魚狂熱者)
          </Button>
        </div>

        <div className="border-t border-white/10 my-2"></div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="gold" onClick={onShowLeaderboard} className="w-full text-sm md:text-base">
            🏆 榮譽榜
          </Button>
          <Button variant="secondary" onClick={onShowHistory} className="w-full text-sm md:text-base">
            📜 歷史記錄
          </Button>
        </div>
      </div>

      {/* Decorative Footer */}
      <div className="mt-8 text-blue-400/60 text-sm">
        Power by Gemini 2.5 • Designed for Aquarists
      </div>
    </div>
  );
};
