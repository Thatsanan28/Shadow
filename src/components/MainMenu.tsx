import React, { useState, useEffect } from 'react';
import { Gamepad2, Sliders, HelpCircle, Trophy, Sparkles, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { GameSettings, HighScore } from '../types';
import { audio } from '../utils/audio';

interface MainMenuProps {
  settings: GameSettings;
  onStartGame: () => void;
  onOpenOptions: () => void;
  onOpenHowToPlay: () => void;
  onOpenHighScores: () => void;
}

export default function MainMenu({ 
  settings, 
  onStartGame, 
  onOpenOptions, 
  onOpenHowToPlay, 
  onOpenHighScores 
}: MainMenuProps) {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [soundActive, setSoundActive] = useState(settings.soundEnabled);

  useEffect(() => {
    // Attempt starting theme music when menu mounts (with safe user interaction bypass)
    audio.setMute(!soundActive);
    if (soundActive) {
      audio.startMusic();
    }
    return () => {
      audio.stopMusic();
    };
  }, [soundActive]);

  const handleStartPlay = () => {
    audio.playCollect();
    audio.stopMusic();
    onStartGame();
  };

  const handleNavClick = (callback: () => void) => {
    audio.playClick();
    callback();
  };

  const toggleSound = () => {
    const nextSound = !soundActive;
    setSoundActive(nextSound);
    audio.playClick();
    audio.setMute(!nextSound);
    if (nextSound) {
      audio.startMusic();
    } else {
      audio.stopMusic();
    }
  };

  return (
    <div id="main-menu-container" className="relative flex flex-col justify-between items-center w-full h-full text-white bg-black font-kanit p-6 select-none overflow-y-auto">
      {/* Decorative Traditional Lantern Backdrop glow effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-red-600/30 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/20 blur-[100px]" />
      </div>

      {/* Top Utility bar (Mute control and credits) */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-1.5 text-[10px] tracking-wider text-red-500 font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>เทศกาลผีตาโขน • ด่านซ้าย จ.เลย</span>
        </div>
        <button
          id="btn-sound-toggle-menu"
          onClick={toggleSound}
          className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors duration-200"
          title={soundActive ? "ปิดเสียงดนตรีประกอบ" : "เปิดเสียงดนตรีประกอบ"}
        >
          {soundActive ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Title & Logo block */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full py-8 text-center z-10">
        {/* Game Logo.png with loader guard */}
        <div className="relative w-44 h-44 mb-4 flex items-center justify-center">
          {!logoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-zinc-950 border border-dashed border-red-500/40 animate-pulse">
              <span className="text-[10px] text-zinc-500 font-mono">กำลังโหลดโลโก้...</span>
            </div>
          )}
          <img 
            id="game-logo"
            src="https://res.cloudinary.com/dsucg33fv/image/upload/v1782439979/logo_fj2ctz.png"
            alt="Dan Sai Adventure"
            referrerPolicy="no-referrer"
            onLoad={() => setLogoLoaded(true)}
            className={`w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-opacity duration-700 ${
              logoLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          />
        </div>

        {/* Game Title with Kanit Google Font */}
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest kanit-glow text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-500 to-yellow-400 select-none">
            Dan Sai Adventure
          </h1>
          <p className="text-sm tracking-wider text-zinc-400 font-medium">
            ด่านซ้าย แอดเวนเจอร์ : การพจญภัยของผีตาโขนผู้กล้า
          </p>
        </div>
      </div>

      {/* Navigation menus */}
      <div className="max-w-xs w-full space-y-3 pb-8 z-10">
        {/* Start Game button */}
        <button
          id="btn-play-game"
          onClick={handleStartPlay}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl text-base font-bold text-black bg-gradient-to-r from-red-500 via-amber-500 to-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all cursor-pointer transform hover:scale-102 active:scale-98"
        >
          <Gamepad2 className="w-5 h-5 text-black stroke-[2.5]" />
          <span>เข้าสู่การผจญภัย (Play)</span>
        </button>

        {/* Options Button */}
        <button
          id="btn-options-menu"
          onClick={() => handleNavClick(onOpenOptions)}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl text-sm font-semibold text-zinc-300 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 hover:text-white transition-all cursor-pointer transform hover:scale-102 active:scale-98"
        >
          <Sliders className="w-4 h-4 text-red-500" />
          <span>ตั้งค่าการบังคับ & ตัวละคร</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          {/* High Score board link */}
          <button
            id="btn-highscores-menu"
            onClick={() => handleNavClick(onOpenHighScores)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-400 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 hover:text-white transition-all cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            <span>สถิติสูงสุด</span>
          </button>

          {/* How to play instruction link */}
          <button
            id="btn-howtoplay-menu"
            onClick={() => handleNavClick(onOpenHowToPlay)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-400 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 hover:text-white transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>วิธีเล่นเกม</span>
          </button>
        </div>
      </div>

      {/* Footer credits bar */}
      <div className="w-full border-t border-zinc-950 pt-3 flex justify-between text-[10px] text-zinc-600 font-mono">
        <span>© 2026 DAN SAI ADVENTURE PROJECT</span>
        <span>PROUDLY MADE IN THAILAND</span>
      </div>
    </div>
  );
}
