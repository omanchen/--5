
import { QuizQuestion, Difficulty, HistoryRecord } from '../types';

const HISTORY_KEY = 'goldfish_history_v1';

export const storageService = {
  getHistory: (): HistoryRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addHistory: (
    questions: QuizQuestion[], 
    userAnswers: Record<number, { selectedOption: number | null }>, 
    difficulty: Difficulty
  ) => {
    const prev = storageService.getHistory();
    
    const newRecords: HistoryRecord[] = questions.map((q, idx) => {
      const answerState = userAnswers[idx];
      // Only record questions that were actually answered
      if (!answerState || answerState.selectedOption === null) return null;
      
      return {
        id: q.id,
        date: new Date().toISOString(),
        question: q.question,
        userSelectedOption: answerState.selectedOption,
        correctOption: q.correctAnswerIndex,
        isCorrect: answerState.selectedOption === q.correctAnswerIndex,
        explanation: q.explanation,
        difficulty: difficulty,
        options: q.options
      };
    }).filter((x): x is HistoryRecord => x !== null);

    // Prepend new records (newest first)
    const updated = [...newRecords, ...prev];
    
    // Limit to last 200 items to prevent localStorage overflow
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated.slice(0, 200)));
  },

  // Returns a list of recently asked questions to avoid duplication
  getRecentQuestionTexts: (limit: number = 30): string[] => {
    const history = storageService.getHistory();
    // Use Set to ensure uniqueness
    const texts = Array.from(new Set(history.map(h => h.question)));
    return texts.slice(0, limit);
  },
  
  clearHistory: () => {
    localStorage.removeItem(HISTORY_KEY);
  }
};
