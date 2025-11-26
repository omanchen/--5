
import React, { useState, useEffect } from 'react';
import { GameState, GameScreen, Difficulty, LeaderboardEntry } from './types';
import { generateQuizQuestions } from './services/geminiService';
import { MainMenu } from './components/MainMenu';
import { GameScreen as GameScreenComponent } from './components/GameScreen';
import { Leaderboard } from './components/Leaderboard';
import { HistoryScreen } from './components/HistoryScreen';
import { Button } from './components/Button';
import { audioService } from './services/audioService';
import { speechService } from './services/speechService';
import { storageService } from './services/storageService';
import { AquariumBackground } from './components/AquariumBackground';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentScreen: 'MENU',
    difficulty: Difficulty.EASY,
    score: 0,
    questions: [],
    currentQuestionIndex: 0,
    isLoading: false,
    history: []
  });

  const [playerName, setPlayerName] = useState('');
  const [isMuted, setIsMuted] = useState(audioService.getMuteState());

  // Initialize services on load
  useEffect(() => {
    const muted = audioService.getMuteState();
    setIsMuted(muted);
    speechService.setMute(muted);
  }, []);

  const startGame = async (difficulty: Difficulty) => {
    setGameState(prev => ({ ...prev, isLoading: true, difficulty }));
    
    try {
      const questions = await generateQuizQuestions(difficulty);
      setGameState({
        currentScreen: 'PLAYING',
        difficulty,
        score: 0,
        questions,
        currentQuestionIndex: 0,
        isLoading: false,
        history: []
      });
    } catch (error) {
      alert("Failed to load questions. Please check your API Key or try again.");
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const endGame = (finalScore: number, answerHistory: Record<number, any>) => {
    // Save question history for deduplication and review
    storageService.addHistory(gameState.questions, answerHistory, gameState.difficulty);
    
    setGameState(prev => ({ ...prev, currentScreen: 'GAME_OVER', score: finalScore }));
  };

  const saveScore = () => {
    if (!playerName.trim()) return;

    const entry: LeaderboardEntry = {
      name: playerName,
      score: gameState.score,
      difficulty: gameState.difficulty,
      date: new Date().toISOString()
    };

    const existing = localStorage.getItem('goldfish_leaderboard');
    const list = existing ? JSON.parse(existing) : [];
    list.push(entry);
    localStorage.setItem('goldfish_leaderboard', JSON.stringify(list));

    setGameState(prev => ({ ...prev, currentScreen: 'LEADERBOARD' }));
  };

  const toggleMute = () => {
    audioService.initAudio(); // Ensure context is ready
    const newState = audioService.toggleMute();
    setIsMuted(newState);
    speechService.setMute(newState); // Also toggle speech
  };

  // Helper to determine Game Over visuals
  const getGameOverVisuals = (score: number) => {
    // Calculate max possible score estimate (assuming 100 per question, usually 5 questions)
    // Adjust logic based on absolute score thresholds
    if (score === 0) {
      return { 
        emoji: "😭", 
        anim: "animate-bounce", 
        filter: "drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] grayscale-[0.5]",
        text: "慘不忍睹..." 
      };
    }
    if (score < 300) {
      return { 
        emoji: "🥺", 
        anim: "animate-pulse", 
        filter: "drop-shadow-[0_0_10px_rgba(148,163,184,0.5)]",
        text: "還需努力..." 
      };
    }
    if (score < 500) {
      return { 
        emoji: "🏆", 
        anim: "animate-bounce", 
        filter: "drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]",
        text: "做得好！" 
      };
    }
    // Perfect Score (Assuming 500 or more)
    return { 
      emoji: "👑", 
      anim: "animate-[spin_3s_linear_infinite]", 
      filter: "drop-shadow-[0_0_25px_rgba(255,215,0,1)] brightness-125",
      text: "金魚大師！" 
    };
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-8 px-4 relative">
      
      {/* Dynamic Aquarium Background */}
      <AquariumBackground />

      {/* Sound Toggle Button (Top Right) */}
      <button 
        onClick={toggleMute}
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-slate-800/80 text-white border border-white/10 hover:bg-slate-700 transition-all shadow-lg backdrop-blur-md"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          // Mute Icon
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
        ) : (
          // Sound Icon
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
        )}
      </button>

      {gameState.currentScreen === 'MENU' && (
        <MainMenu 
          onStartGame={startGame} 
          onShowLeaderboard={() => setGameState(prev => ({ ...prev, currentScreen: 'LEADERBOARD' }))} 
          onShowHistory={() => setGameState(prev => ({ ...prev, currentScreen: 'HISTORY' }))}
          isLoading={gameState.isLoading}
        />
      )}

      {gameState.currentScreen === 'PLAYING' && (
        <GameScreenComponent 
          questions={gameState.questions}
          onGameEnd={endGame}
          onExit={() => setGameState(prev => ({ ...prev, currentScreen: 'MENU' }))}
        />
      )}

      {gameState.currentScreen === 'LEADERBOARD' && (
        <Leaderboard onBack={() => setGameState(prev => ({ ...prev, currentScreen: 'MENU' }))} />
      )}

      {gameState.currentScreen === 'HISTORY' && (
        <HistoryScreen onBack={() => setGameState(prev => ({ ...prev, currentScreen: 'MENU' }))} />
      )}

      {gameState.currentScreen === 'GAME_OVER' && (() => {
        const visuals = getGameOverVisuals(gameState.score);
        return (
          <div className="relative z-10 glass-panel p-8 md:p-12 rounded-3xl max-w-md w-full text-center flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-4xl font-display gold-text mb-2">遊戲結束</h2>
            
            {/* Animated Emoji Section */}
            <div className="relative h-32 flex items-center justify-center mb-2">
               <div className={`text-8xl select-none transition-all duration-500 ${visuals.anim} ${visuals.filter}`}>
                 {visuals.emoji}
               </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-6xl font-bold text-white tracking-tight">
                {gameState.score} 
                <span className="text-xl text-slate-400 ml-2">分</span>
              </div>
              <p className="text-2xl font-display text-blue-200">{visuals.text}</p>
            </div>
            
            <p className="text-slate-300 italic text-sm border-t border-white/10 pt-4 mt-2">
              {gameState.score === 0 ? "一分都無？你係咪條魚扮人玩遊戲？" : 
               gameState.score < 300 ? "雖然唔係零蛋，但都好勉強喎..." :
               "嘩！高手在民間！受我一拜！"}
            </p>

            <div className="bg-white/5 p-4 rounded-xl mt-2">
              <label className="block text-left text-sm text-blue-200 mb-2">留個大名上榜：</label>
              <input 
                type="text" 
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="輸入你的名字"
                className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition-colors"
                maxLength={10}
              />
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <Button variant="gold" onClick={saveScore} disabled={!playerName.trim()}>
                保存成績
              </Button>
              <Button variant="secondary" onClick={() => setGameState(prev => ({ ...prev, currentScreen: 'MENU' }))}>
                不保存，回主頁
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default App;
