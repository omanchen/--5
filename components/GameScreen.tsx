
import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';
import { Button } from './Button';
import { audioService } from '../services/audioService';
import { speechService } from '../services/speechService';

interface GameScreenProps {
  questions: QuizQuestion[];
  onGameEnd: (score: number, answerHistory: Record<number, any>) => void;
  onExit: () => void;
}

interface QuestionState {
  selectedOption: number | null;
  isConfirmed: boolean;
  feedback: 'correct' | 'incorrect' | null;
}

export const GameScreen: React.FC<GameScreenProps> = ({ questions, onGameEnd, onExit }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  
  // Store state for each question individually to allow navigation
  const [answerHistory, setAnswerHistory] = useState<Record<number, QuestionState>>({});

  const currentQuestion = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;

  // Get current state or default
  const currentState = answerHistory[currentIdx] || {
    selectedOption: null,
    isConfirmed: false,
    feedback: null
  };

  const { selectedOption, isConfirmed, feedback } = currentState;

  // Voice effect when question changes
  useEffect(() => {
    // Only speak the question if we haven't answered it yet (or just arrived at it)
    if (!isConfirmed) {
      // Small timeout to allow transition sounds to play first
      const timer = setTimeout(() => {
        // Question uses Neutral/Female voice
        speechService.speak(currentQuestion.question, 'neutral');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIdx, currentQuestion, isConfirmed]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      speechService.cancel();
    };
  }, []);

  const handleOptionSelect = (idx: number) => {
    if (isConfirmed) return;
    audioService.playClick();
    
    setAnswerHistory(prev => ({
      ...prev,
      [currentIdx]: { ...currentState, selectedOption: idx }
    }));
  };

  const handleConfirm = () => {
    if (selectedOption === null) return;
    
    const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;
    const newFeedback = isCorrect ? 'correct' : 'incorrect';
    
    setAnswerHistory(prev => ({
      ...prev,
      [currentIdx]: { 
        ...currentState, 
        isConfirmed: true, 
        feedback: newFeedback 
      }
    }));
    
    if (isCorrect) {
      audioService.playCorrect();
      setScore(prev => prev + 100);
      // Speak Praise + Explanation with Gentle Female Voice
      speechService.speak(`${currentQuestion.praise}。${currentQuestion.explanation}`, 'gentle');
    } else {
      audioService.playIncorrect();
      
      // Random harsh insults
      const insults = [
        "你個死白痴！",
        "你個傻佬！",
        "你個低能佬！",
        "廢柴！",
        "食屎啦你！",
        "有無搞錯呀？",
        "腦殘呀你！"
      ];
      const randomInsult = insults[Math.floor(Math.random() * insults.length)];

      // Speak Roast + Explanation with Aggressive Male Voice
      // Prepend the insult
      speechService.speak(`${randomInsult} ${currentQuestion.roast}。${currentQuestion.explanation}`, 'aggressive');
    }
  };

  const handleNext = () => {
    speechService.cancel(); // Stop current speech
    if (isLastQuestion) {
      audioService.playGameEnd();
      // Pass the final answer history to parent for saving
      onGameEnd(score, { ...answerHistory });
    } else {
      audioService.playClick();
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    speechService.cancel(); // Stop current speech
    if (currentIdx > 0) {
      audioService.playClick();
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleHomeClick = () => {
    audioService.playClick();
    setShowExitModal(true);
  };

  const confirmExit = () => {
    speechService.cancel();
    audioService.playClick();
    onExit();
  };

  const cancelExit = () => {
    audioService.playClick();
    setShowExitModal(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-6 relative z-10">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center glass-panel p-4 rounded-xl">
        <Button variant="secondary" onClick={handleHomeClick} className="text-sm py-2 flex items-center gap-2">
          <span>🏠</span> <span className="hidden md:inline">返回主頁</span>
        </Button>
        <div className="text-xl font-bold font-display gold-text tracking-widest">
          第 {currentIdx + 1} / {questions.length} 題
        </div>
        <div className="text-xl font-bold text-blue-200">
          分數: <span className="text-yellow-400">{score}</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-panel p-8 rounded-2xl border-t-4 border-t-yellow-500 shadow-2xl relative overflow-hidden min-h-[200px] md:min-h-[300px] flex flex-col justify-center items-center text-center">
        <h2 className="text-xl md:text-3xl font-bold mb-6 leading-relaxed text-white drop-shadow-md break-words w-full">
          {currentQuestion.question}
        </h2>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQuestion.options.map((option, idx) => {
          let statusClass = "hover:bg-blue-800/50 border-blue-500/30"; // Default
          
          if (selectedOption === idx && !isConfirmed) {
            statusClass = "bg-blue-600 border-blue-400 ring-2 ring-blue-300"; // Selected
          }

          if (isConfirmed) {
            if (idx === currentQuestion.correctAnswerIndex) {
              statusClass = "bg-green-600/80 border-green-400 ring-2 ring-green-400"; // Correct Answer
            } else if (selectedOption === idx && idx !== currentQuestion.correctAnswerIndex) {
              statusClass = "bg-red-600/80 border-red-400 ring-2 ring-red-400"; // Wrong Selection
            } else {
              statusClass = "opacity-30 pointer-events-none"; // Others
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionSelect(idx)}
              disabled={isConfirmed}
              className={`
                relative p-5 md:p-6 rounded-xl border transition-all duration-200 
                flex items-center justify-between group text-left h-full w-full min-h-[5rem]
                ${statusClass} 
                ${!isConfirmed ? 'glass-panel' : ''}
              `}
            >
              <span className="flex-1 font-medium text-base md:text-lg break-words leading-snug">{option}</span>
              
              {isConfirmed && idx === currentQuestion.correctAnswerIndex && (
                <span className="text-2xl ml-4 flex-shrink-0">✅</span>
              )}
              {isConfirmed && selectedOption === idx && idx !== currentQuestion.correctAnswerIndex && (
                <span className="text-2xl ml-4 flex-shrink-0">❌</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Area */}
      <div className="flex gap-4 mt-4">
        {/* Previous Button */}
        <div className="w-1/4">
          {currentIdx > 0 && (
            <Button 
              variant="secondary" 
              onClick={handlePrev}
              className="w-full h-full text-lg"
            >
              ← 上一題
            </Button>
          )}
        </div>

        {/* Main Action Button (Confirm or Next) */}
        <div className="flex-1">
          {!isConfirmed ? (
            <Button 
              variant="gold" 
              onClick={handleConfirm} 
              disabled={selectedOption === null}
              className="w-full text-xl py-4"
            >
              確定答案
            </Button>
          ) : (
            <Button 
              variant="primary" 
              onClick={handleNext}
              className="w-full text-xl py-4 animate-pulse hover:animate-none"
            >
              {isLastQuestion ? "查看成績 🏆" : "下一題 →"}
            </Button>
          )}
        </div>
      </div>

      {/* Feedback Overlay/Modal Area */}
      {isConfirmed && (
        <div className={`
          rounded-xl p-6 border-l-8 shadow-lg transition-all duration-500 transform translate-y-0 opacity-100
          ${feedback === 'correct' 
            ? 'bg-green-900/90 border-green-500 text-green-100' 
            : 'bg-red-900/90 border-red-500 text-red-100'}
        `}>
          <div className="flex flex-col gap-3">
            <h3 className="text-2xl font-bold font-display">
              {feedback === 'correct' ? '🎉 答啱咗！' : '💀 答錯啦！'}
            </h3>
            
            {/* The Personality Message */}
            <p className="text-lg italic font-medium border-b border-white/20 pb-2">
              "{feedback === 'correct' ? currentQuestion.praise : currentQuestion.roast}"
            </p>

            {/* Scientific Explanation */}
            <div className="mt-2 text-sm md:text-base opacity-90">
              <span className="font-bold bg-black/30 px-2 py-1 rounded mr-2">解釋</span>
              {currentQuestion.explanation}
            </div>
          </div>
        </div>
      )}

      {/* Custom Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="glass-panel p-8 rounded-2xl max-w-sm w-full text-center border-t-4 border-red-500 shadow-2xl scale-100 animate-[scaleIn_0.3s_ease-out]">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold mb-4 text-white">確定要撤退？</h3>
            <p className="mb-8 text-slate-300 leading-relaxed">
              現在返回主頁的話，<br/>您目前的挑戰進度與分數將會<span className="text-red-400 font-bold">全部消失</span>！
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button variant="secondary" onClick={cancelExit} className="w-full md:w-auto">
                取消
              </Button>
              <Button variant="danger" onClick={confirmExit} className="w-full md:w-auto">
                確定離開
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
