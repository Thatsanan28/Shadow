import React, { useState, useEffect } from 'react';
import { GameScreen, GameSettings } from './types';
import MainMenu from './components/MainMenu';
import OptionsScreen from './components/OptionsScreen';
import GameCanvas from './components/GameCanvas';
import HowToPlay from './components/HowToPlay';
import HighScoresScreen from './components/HighScoresScreen';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('main-menu');
  const [settings, setSettings] = useState<GameSettings>({
    keyBindings: {
      left: 'ArrowLeft',
      right: 'ArrowRight',
      jump: 'Space',
      attack: 'f',
      dash: 'x'
    },
    preset: 'classic',
    virtualButtons: {
      enabled: true,
      size: 'md',
      opacity: 0.6,
      layout: 'split',
      showLabels: true
    },
    character: {
      mask: 'classic-red',
      color: '#ef4444',
      name: 'ผู้กล้าด่านซ้าย'
    },
    soundEnabled: true
  });

  // Load settings from Local Storage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('dansai_game_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed loading settings", e);
      }
    }
  }, []);

  const handleSaveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem('dansai_game_settings', JSON.stringify(newSettings));
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black overflow-hidden font-sans">
      <div className="relative w-full h-full max-w-5xl max-h-[700px] md:rounded-2xl md:border md:border-zinc-900 bg-black shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {screen === 'main-menu' && (
          <MainMenu 
            settings={settings}
            onStartGame={() => setScreen('playing')}
            onOpenOptions={() => setScreen('options')}
            onOpenHowToPlay={() => setScreen('how-to-play')}
            onOpenHighScores={() => setScreen('high-scores')}
          />
        )}

        {screen === 'options' && (
          <OptionsScreen 
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onBack={() => setScreen('main-menu')}
          />
        )}

        {screen === 'playing' && (
          <GameCanvas 
            settings={settings}
            onGameOver={(score) => {
              // Trigger high scores screen on game over
              setScreen('high-scores');
            }}
            onQuit={() => setScreen('main-menu')}
          />
        )}

        {screen === 'how-to-play' && (
          <HowToPlay 
            keyBindings={settings.keyBindings}
            onBack={() => setScreen('main-menu')}
          />
        )}

        {screen === 'high-scores' && (
          <HighScoresScreen 
            onBack={() => setScreen('main-menu')}
          />
        )}
      </div>
    </div>
  );
}
