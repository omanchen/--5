import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { Button } from './Button';

interface LeaderboardProps {
  onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('goldfish_leaderboard');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Sort by score descending
        setScores(parsed.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score));
      } catch (e) {
        console.error("Failed to parse leaderboard", e);
      }
    }
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 z-10 relative h-full flex flex-col">
      <div className="glass-panel rounded-3xl p-8 flex flex-col h-full max-h-[80vh]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-display gold-text">榮譽榜</h2>
          <Button variant="secondary" onClick={onBack}>返回主頁</Button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {scores.length === 0 ? (
            <div className="text-center text-slate-400 py-20">
              暫時未有紀錄。快啲去挑戰啦！
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-blue-300 border-b border-blue-500/30">
                  <th className="py-4 px-2">排名</th>
                  <th className="py-4 px-2">玩家</th>
                  <th className="py-4 px-2">難度</th>
                  <th className="py-4 px-2 text-right">分數</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((entry, idx) => (
                  <tr key={idx} className="border-b border-blue-500/10 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-2 font-bold">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="py-4 px-2 truncate max-w-[120px]">{entry.name}</td>
                    <td className="py-4 px-2 text-sm text-slate-400">{entry.difficulty}</td>
                    <td className="py-4 px-2 text-right font-mono text-yellow-400 font-bold">{entry.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
