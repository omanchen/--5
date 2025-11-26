
import React, { useEffect, useState } from 'react';
import { HistoryRecord } from '../types';
import { Button } from './Button';
import { storageService } from '../services/storageService';

interface HistoryScreenProps {
  onBack: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    setHistory(storageService.getHistory());
  }, []);

  const handleClear = () => {
    if (confirm("確定要清除所有歷史記錄？")) {
      storageService.clearHistory();
      setHistory([]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 z-10 relative h-full flex flex-col">
      <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col h-[85vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-display gold-text">挑戰回顧</h2>
          <div className="flex gap-2">
            {history.length > 0 && (
              <Button variant="danger" onClick={handleClear} className="text-xs px-3 py-2">
                清除記錄
              </Button>
            )}
            <Button variant="secondary" onClick={onBack} className="text-xs px-3 py-2">
              返回
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <span className="text-4xl mb-2">📜</span>
              <p>暫時未有記錄。去玩幾局先啦！</p>
            </div>
          ) : (
            history.map((record, idx) => (
              <div key={`${record.id}-${idx}`} className="bg-slate-900/40 border border-white/5 rounded-xl p-4 transition-all hover:bg-slate-800/40">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs px-2 py-1 rounded font-bold ${
                    record.isCorrect ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {record.isCorrect ? '答啱 ✅' : '答錯 ❌'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(record.date).toLocaleDateString()} • {record.difficulty}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-3 leading-snug">
                  {record.question}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    {record.options?.map((opt, optIdx) => {
                        let style = "opacity-50";
                        if (optIdx === record.correctOption) style = "text-green-400 font-bold opacity-100";
                        else if (optIdx === record.userSelectedOption && !record.isCorrect) style = "text-red-400 font-bold opacity-100 line-through";
                        
                        return (
                            <div key={optIdx} className={`text-sm ${style} flex items-center gap-2`}>
                                <span className="text-[10px] border border-current rounded px-1">{optIdx + 1}</span>
                                {opt}
                            </div>
                        )
                    })}
                </div>

                <div className="text-sm text-blue-200 bg-blue-900/20 p-3 rounded-lg border-l-2 border-blue-400">
                  <span className="font-bold text-blue-400 block mb-1">解釋：</span>
                  {record.explanation}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
