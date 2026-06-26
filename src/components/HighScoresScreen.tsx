import React, { useState, useEffect } from 'react';
import { Trophy, ArrowLeft, Trash2, Award, Calendar, Sparkles } from 'lucide-react';
import { HighScore, MaskType } from '../types';
import { audio } from '../utils/audio';

interface HighScoresScreenProps {
  onBack: () => void;
}

export default function HighScoresScreen({ onBack }: HighScoresScreenProps) {
  const [scores, setScores] = useState<HighScore[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('dansai_high_scores');
    if (saved) {
      try {
        setScores(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed default epic high scores so the scoreboard never looks empty on first boot!
      const defaults: HighScore[] = [
        { name: 'สิงห์ด่านซ้าย', score: 1250, date: '25/06/2026', mask: 'classic-red' },
        { name: 'ยอดกุมารรี', score: 900, date: '24/06/2026', mask: 'golden-flame' },
        { name: 'ขุนแผนเลย', score: 750, date: '23/06/2026', mask: 'forest-green' },
        { name: 'เทพพายุภูเขา', score: 450, date: '22/06/2026', mask: 'royal-purple' },
      ];
      setScores(defaults);
      localStorage.setItem('dansai_high_scores', JSON.stringify(defaults));
    }
  }, []);

  const handleClear = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตกระดานคะแนน?')) {
      audio.playHit();
      setScores([]);
      localStorage.removeItem('dansai_high_scores');
    }
  };

  const getMaskEmoji = (mask: MaskType) => {
    switch (mask) {
      case 'classic-red': return '👹';
      case 'forest-green': return '👺';
      case 'royal-purple': return '👾';
      case 'golden-flame': return '🌟';
      default: return '👹';
    }
  };

  const getMaskColor = (mask: MaskType) => {
    switch (mask) {
      case 'classic-red': return 'text-red-500';
      case 'forest-green': return 'text-emerald-500';
      case 'royal-purple': return 'text-purple-500';
      case 'golden-flame': return 'text-amber-500';
      default: return 'text-red-500';
    }
  };

  return (
    <div id="highscores-panel" className="relative flex flex-col w-full h-full text-white bg-black font-kanit p-4 md:p-6 select-none overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between z-10 border-b border-zinc-900 pb-3 mb-6">
        <button 
          id="btn-back-highscores"
          onClick={() => { audio.playClick(); onBack(); }}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-zinc-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>ย้อนกลับ</span>
        </button>
        <h2 className="text-xl md:text-2xl font-bold tracking-wider text-red-500 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span>กระดานเกียรติยศด่านซ้าย</span>
        </h2>
        <button 
          id="btn-clear-highscores"
          onClick={handleClear}
          className="p-2 text-zinc-500 hover:text-red-500 rounded-lg hover:bg-zinc-900 transition-colors"
          title="ลบสถิติทั้งหมด"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between z-10">
        
        {/* Leaderboard list container */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 md:p-6 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-bold tracking-wider px-2 border-b border-zinc-900 pb-2">
            <span>อันดับ / ผู้กล้าผีตาโขน</span>
            <span>คะแนนสูงสุด</span>
          </div>

          {scores.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-sm">
              ยังไม่มีคะแนนถูกบันทึกในกระดานนี้ เริ่มเล่นคนแรกเลย!
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((score, index) => {
                const isTop1 = index === 0;
                const isTop2 = index === 1;
                const isTop3 = index === 2;

                return (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isTop1 
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-sm' 
                        : 'bg-zinc-900/60 border-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Place ranking ribbon */}
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isTop1 
                          ? 'bg-amber-500 text-black' 
                          : isTop2 
                          ? 'bg-zinc-300 text-black' 
                          : isTop3 
                          ? 'bg-amber-800 text-white' 
                          : 'bg-zinc-950 text-zinc-400'
                      }`}>
                        {index + 1}
                      </span>

                      {/* Character/Mask used emoji and user name */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-base" title={`หน้ากาก ${score.mask}`}>
                          {getMaskEmoji(score.mask)}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm tracking-wide text-zinc-100">{score.name}</span>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{score.date}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score value */}
                    <div className="flex items-center gap-1">
                      {isTop1 && <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                      <span className={`font-mono font-black text-base md:text-lg tracking-wider ${
                        isTop1 ? 'text-amber-400' : 'text-zinc-300'
                      }`}>
                        {score.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Small motivational quote */}
        <div className="text-center py-4 text-xs text-zinc-500 italic max-w-xs mx-auto">
          "วิ่งหลบหนามเพื่อทะยานสู่อันดับสูงสุด บัญญัติชื่อในประเพณีบุญหลวงด่านซ้าย!"
        </div>
      </div>
    </div>
  );
}
