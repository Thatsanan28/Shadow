export interface KeyBindings {
  left: string;
  right: string;
  jump: string;
  attack: string;
  dash: string;
}

export type ControlPreset = 'default' | 'wasd' | 'classic' | 'custom';

export type OnScreenLayout = 'split' | 'classic-arcade' | 'right-aligned';

export interface VirtualButtonSettings {
  enabled: boolean;
  size: 'sm' | 'md' | 'lg';
  opacity: number; // 0.1 to 1.0
  layout: OnScreenLayout;
  showLabels: boolean;
}

export type MaskType = 'classic-red' | 'forest-green' | 'royal-purple' | 'golden-flame';

export interface CharacterSettings {
  mask: MaskType;
  color: string;
  name: string;
}

export interface GameSettings {
  keyBindings: KeyBindings;
  preset: ControlPreset;
  virtualButtons: VirtualButtonSettings;
  character: CharacterSettings;
  soundEnabled: boolean;
}

export interface HighScore {
  name: string;
  score: number;
  date: string;
  mask: MaskType;
}

export type GameScreen = 'main-menu' | 'options' | 'playing' | 'game-over' | 'how-to-play' | 'high-scores';
