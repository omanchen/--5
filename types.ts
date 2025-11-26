
export enum Difficulty {
  EASY = '初級',
  MEDIUM = '中級',
  HARD = '地獄級',
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  explanation: string;
  roast: string; // Mean comment for wrong answer
  praise: string; // Nice comment for correct answer
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
  difficulty: Difficulty;
}

export interface HistoryRecord {
  id: string;
  date: string;
  question: string;
  userSelectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  explanation: string;
  difficulty: Difficulty;
  options: string[]; // Store options to reconstruct context if needed
}

export type GameScreen = 'MENU' | 'PLAYING' | 'GAME_OVER' | 'LEADERBOARD' | 'HISTORY';

export interface GameState {
  currentScreen: GameScreen;
  difficulty: Difficulty;
  score: number;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  isLoading: boolean;
  history: boolean[]; // track correct/incorrect for summary
}
