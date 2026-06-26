import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Keyboard, Sliders, Smartphone, Check, RotateCcw, Gamepad2, User, HelpCircle, 
  ChevronLeft, ChevronRight, Sparkles 
} from 'lucide-react';
import { GameSettings, KeyBindings, ControlPreset, OnScreenLayout, MaskType } from '../types';
import { audio } from '../utils/audio';

interface OptionsScreenProps {
  settings: GameSettings;
  onSaveSettings: (settings: GameSettings) => void;
  onBack: () => void;
}

export default function OptionsScreen({ settings, onSaveSettings, onBack }: OptionsScreenProps) {
  const [currentSettings, setCurrentSettings] = useState<GameSettings>({ ...settings });
  const [activeBinding, setActiveBinding] = useState<keyof KeyBindings | null>(null);
  const [activeTab, setActiveTab] = useState<'character' | 'keyboard' | 'virtual'>('character');

  const handleSoundToggle = () => {
    audio.playClick();
    const newSound = !currentSettings.soundEnabled;
    audio.setMute(!newSound);
    setCurrentSettings(prev => ({
      ...prev,
      soundEnabled: newSound
    }));
  };

  // Keyboard binding logic
  useEffect(() => {
    if (!activeBinding) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      audio.playClick();
      const pressedKey = e.key === ' ' ? 'Space' : e.key;
      
      setCurrentSettings(prev => ({
        ...prev,
        preset: 'custom',
        keyBindings: {
          ...prev.keyBindings,
          [activeBinding]: pressedKey
        }
      }));
      setActiveBinding(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeBinding]);

  const selectPreset = (preset: ControlPreset) => {
    audio.playClick();
    let keyBindings: KeyBindings = { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', attack: 'f', dash: 'Shift' };
    
    if (preset === 'wasd') {
      keyBindings = { left: 'a', right: 'd', jump: 'w', attack: 'j', dash: 'k' };
    } else if (preset === 'classic') {
      keyBindings = { left: 'ArrowLeft', right: 'ArrowRight', jump: 'Space', attack: 'f', dash: 'x' };
    }

    setCurrentSettings(prev => ({
      ...prev,
      preset,
      keyBindings
    }));
  };

  const updateVirtualSettings = <K extends keyof GameSettings['virtualButtons']>(
    key: K, 
    value: GameSettings['virtualButtons'][K]
  ) => {
    audio.playClick();
    setCurrentSettings(prev => ({
      ...prev,
      virtualButtons: {
        ...prev.virtualButtons,
        [key]: value
      }
    }));
  };

  const handleReset = () => {
    audio.playHit();
    setCurrentSettings({
      keyBindings: { left: 'ArrowLeft', right: 'ArrowRight', jump: 'Space', attack: 'f', dash: 'x' },
      preset: 'classic',
      virtualButtons: {
        enabled: true,
        size: 'md',
        opacity: 0.6,
        layout: 'split',
        showLabels: true,
      },
      character: {
        mask: 'classic-red',
        color: '#ef4444',
        name: currentSettings.character.name || 'ผีตาโขนผู้กล้า'
      },
      soundEnabled: currentSettings.soundEnabled
    });
  };

  const handleSave = () => {
    audio.playCollect();
    onSaveSettings(currentSettings);
    onBack();
  };

  // Character customizer options
  const masksList: { type: MaskType; name: string; color: string; desc: string }[] = [
    { type: 'classic-red', name: 'แดงเพลิงสยาม (Red Devildom)', color: '#ef4444', desc: 'หน้ากากตาโขนสีแดงสุดคลาสสิก ดุดัน ทรงพลัง' },
    { type: 'forest-green', name: 'พฤกษาพนาไพร (Forest Green)', color: '#10b981', desc: 'สีเขียวธรรมชาติของป่าไม้ด่านซ้าย มีมนต์ขลังดั่งโบราณกาล' },
    { type: 'royal-purple', name: 'ม่วงมนต์มายา (Royal Purple)', color: '#a855f7', desc: 'หน้ากากลงลวดลายสีม่วง ลึกลับ มีชีวิตชีวาในค่ำคืนเทศกาล' },
    { type: 'golden-flame', name: 'ทองประกายแสด (Golden Flame)', color: '#f59e0b', desc: 'เหลืองทองเปล่งรัศมี ดึงดูดสายตาทุกดวงใจในงานบุญหลวง' },
  ];

  const currentMaskIndex = masksList.findIndex(m => m.type === currentSettings.character.mask);

  const cycleMask = (direction: 'prev' | 'next') => {
    audio.playClick();
    let nextIndex = direction === 'next' ? currentMaskIndex + 1 : currentMaskIndex - 1;
    if (nextIndex >= masksList.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = masksList.length - 1;
    
    const selected = masksList[nextIndex];
    setCurrentSettings(prev => ({
      ...prev,
      character: {
        ...prev.character,
        mask: selected.type,
        color: selected.color
      }
    }));
  };

  return (
    <div id="options-panel" className="relative flex flex-col w-full h-full text-white bg-black font-kanit p-4 md:p-6 select-none overflow-y-auto">
      {/* Background decoration elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-10">
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-red-600 blur-3xl"></div>
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-amber-500 blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between z-10 border-b border-zinc-800 pb-3 mb-4">
        <button 
          id="btn-back-main"
          onClick={() => { audio.playClick(); onBack(); }}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-zinc-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>ย้อนกลับ</span>
        </button>
        <h2 className="text-xl md:text-2xl font-bold tracking-wider text-red-500 flex items-center gap-2">
          <Sliders className="w-5 h-5" />
          <span>การตั้งค่าปุ่ม & ตัวละคร</span>
        </h2>
        <div className="w-20"></div> {/* Spacer to center title visually */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 z-10 flex-1 min-h-0">
        {/* Left Column: Interactive character visual preview */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-zinc-950 border border-zinc-900 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-2 left-2 flex items-center gap-1.5 text-xs text-amber-500 font-medium">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>ตัวอย่างตัวละครผีตาโขน</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-6">
            {/* Live custom Phi Ta Khon SVG representation */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Bounce Animation wrapper */}
              <div className="animate-bounce" style={{ animationDuration: '2s' }}>
                <svg viewBox="0 0 100 120" className="w-32 h-32 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                  {/* Traditional Hat (Bamboo basket - "Huat") */}
                  <path d="M 25 35 L 50 5 L 75 35 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
                  <path d="M 30 35 L 50 15 L 70 35" fill="none" stroke={currentSettings.character.color} strokeWidth="1.5" />
                  <path d="M 38 35 L 50 25 L 62 35" fill="none" stroke="#eab308" strokeWidth="1.5" />
                  
                  {/* Colorful Streamers on top of Huat */}
                  <path d="M 50 5 Q 40 -2 30 2" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                  <path d="M 50 5 Q 50 -5 55 -2" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                  <path d="M 50 5 Q 60 -2 70 2" fill="none" stroke="#22c55e" strokeWidth="2.5" />

                  {/* Mask Head */}
                  <rect x="25" y="35" width="50" height="50" rx="10" fill="#27272a" stroke="#18181b" strokeWidth="2" />
                  
                  {/* Character Skin Overlay color base */}
                  <rect x="28" y="38" width="44" height="44" rx="8" fill={`${currentSettings.character.color}15`} />

                  {/* Traditional Hand-drawn Eyes with Spirals */}
                  <circle cx="38" cy="55" r="8" fill="#18181b" stroke={currentSettings.character.color} strokeWidth="2" />
                  <circle cx="38" cy="55" r="3" fill="#ffffff" />
                  <circle cx="62" cy="55" r="8" fill="#18181b" stroke={currentSettings.character.color} strokeWidth="2" />
                  <circle cx="62" cy="55" r="3" fill="#ffffff" />

                  {/* Long Pointy Nose (Made of soft wood/coconut shell) */}
                  <path d="M 50 50 L 35 68 L 50 62 Z" fill="#1e1b4b" stroke={currentSettings.character.color} strokeWidth="2" />
                  
                  {/* Broad Smile with scary but friendly teeth */}
                  <path d="M 35 76 Q 50 92 65 76 Z" fill="#18181b" stroke={currentSettings.character.color} strokeWidth="1.5" />
                  <path d="M 38 77 L 42 81 L 46 77 L 50 81 L 54 77 L 58 81 L 62 77" fill="none" stroke="#ffffff" strokeWidth="2" />

                  {/* Traditional ear flaps */}
                  <path d="M 25 45 Q 12 50 25 60" fill="none" stroke={currentSettings.character.color} strokeWidth="2.5" />
                  <path d="M 75 45 Q 88 50 75 60" fill="none" stroke={currentSettings.character.color} strokeWidth="2.5" />

                  {/* Little colorful costume body */}
                  <path d="M 35 85 L 20 115 L 80 115 L 65 85 Z" fill={currentSettings.character.color} opacity="0.85" />
                  {/* Traditional patterns on costume */}
                  <line x1="30" y1="95" x2="70" y2="95" stroke="#eab308" strokeWidth="2" strokeDasharray="3 3" />
                  <line x1="25" y1="105" x2="75" y2="105" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
              </div>
            </div>

            <div className="mt-4 text-center w-full px-2">
              <span className="text-xs text-zinc-400 block mb-1">หน้ากากปัจจุบัน</span>
              <div className="flex items-center justify-between bg-zinc-900 rounded-lg p-2 border border-zinc-800">
                <button 
                  id="btn-mask-prev"
                  onClick={() => cycleMask('prev')}
                  className="p-1 hover:bg-zinc-800 rounded text-red-500 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-semibold text-sm tracking-wide text-white">
                  {masksList[currentMaskIndex].name}
                </span>
                <button 
                  id="btn-mask-next"
                  onClick={() => cycleMask('next')}
                  className="p-1 hover:bg-zinc-800 rounded text-red-500 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-zinc-400 mt-2 italic leading-relaxed min-h-[40px] px-3">
                "{masksList[currentMaskIndex].desc}"
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-900/80">
            <span className="text-xs text-zinc-400 block mb-2">ชื่อตัวละครผีตาโขนผู้กล้า:</span>
            <input 
              id="input-character-name"
              type="text"
              maxLength={15}
              value={currentSettings.character.name}
              onChange={(e) => {
                const val = e.target.value;
                setCurrentSettings(prev => ({
                  ...prev,
                  character: { ...prev.character, name: val }
                }));
              }}
              placeholder="กรอกชื่อฮีโร่ของคุณ"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 text-white rounded px-3 py-1.5 text-sm font-sans outline-none focus:ring-1 focus:ring-red-500 transition-all"
            />
          </div>
        </div>

        {/* Right Column: Setting Tabs & Actions */}
        <div className="lg:col-span-7 flex flex-col bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
          {/* Navigation tab links */}
          <div className="flex border-b border-zinc-900 bg-zinc-900/40">
            <button 
              id="tab-btn-character"
              onClick={() => { audio.playClick(); setActiveTab('character'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm font-semibold transition-colors duration-200 border-b-2 ${
                activeTab === 'character' 
                  ? 'border-red-500 text-red-500 bg-zinc-900/60' 
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/20'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">หน้ากากตาโขน</span>
              <span className="sm:hidden">ตัวละคร</span>
            </button>
            <button 
              id="tab-btn-keyboard"
              onClick={() => { audio.playClick(); setActiveTab('keyboard'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm font-semibold transition-colors duration-200 border-b-2 ${
                activeTab === 'keyboard' 
                  ? 'border-red-500 text-red-500 bg-zinc-900/60' 
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/20'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>ปุ่มคีย์บอร์ด</span>
            </button>
            <button 
              id="tab-btn-virtual"
              onClick={() => { audio.playClick(); setActiveTab('virtual'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm font-semibold transition-colors duration-200 border-b-2 ${
                activeTab === 'virtual' 
                  ? 'border-red-500 text-red-500 bg-zinc-900/60' 
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/20'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">ปุ่มบนหน้าจอ (Touch)</span>
              <span className="sm:hidden">ปุ่มหน้าจอ</span>
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto">
            {/* CHARACTER MASK LIST TAB */}
            {activeTab === 'character' && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-amber-500 flex items-center gap-1.5 mb-2">
                  <User className="w-4 h-4" />
                  <span>เลือกประเภทหน้ากากและสีพลัง</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {masksList.map((maskOption) => (
                    <button
                      id={`mask-select-${maskOption.type}`}
                      key={maskOption.type}
                      onClick={() => {
                        audio.playClick();
                        setCurrentSettings(prev => ({
                          ...prev,
                          character: {
                            ...prev.character,
                            mask: maskOption.type,
                            color: maskOption.color
                          }
                        }));
                      }}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                        currentSettings.character.mask === maskOption.type
                          ? 'bg-zinc-900 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                          : 'bg-zinc-950 border-zinc-900 hover:bg-zinc-900/40 hover:border-zinc-800'
                      }`}
                    >
                      <span 
                        className="w-4 h-4 mt-1 rounded-full flex-shrink-0 border border-black" 
                        style={{ backgroundColor: maskOption.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-sm text-white block truncate">{maskOption.name.split(' (')[0]}</span>
                        <span className="text-xs text-zinc-500 block leading-tight mt-1">{maskOption.desc}</span>
                      </div>
                      {currentSettings.character.mask === maskOption.type && (
                        <Check className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Sound Settings inside configuration */}
                <div className="mt-6 pt-5 border-t border-zinc-900">
                  <h3 className="text-base font-semibold text-zinc-300 mb-3">ตั้งค่าเสียง & ดนตรี</h3>
                  <div className="flex items-center justify-between p-3.5 bg-zinc-900/60 border border-zinc-900 rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">เสียงและดนตรีประกอบเทศกาล</span>
                      <span className="text-xs text-zinc-500 mt-0.5">เปิดเสียงพินแคนและซินธ์เพื่อเพิ่มอรรถรส</span>
                    </div>
                    <button
                      id="btn-sound-toggle-options"
                      onClick={handleSoundToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 outline-none ${
                        currentSettings.soundEnabled ? 'bg-red-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          currentSettings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* KEYBOARD BINDINGS TAB */}
            {activeTab === 'keyboard' && (
              <div className="space-y-4">
                {/* Presets */}
                <div>
                  <label className="text-xs text-zinc-400 block mb-2 font-medium">ชุดปุ่มควบคุมสำเร็จรูป:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      id="preset-btn-classic"
                      type="button"
                      onClick={() => selectPreset('classic')}
                      className={`py-2 px-1 text-xs font-semibold rounded border transition-all ${
                        currentSettings.preset === 'classic'
                          ? 'bg-red-950/40 border-red-500 text-red-400 shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-white'
                      }`}
                    >
                      Classic (ทิศทาง + Space)
                    </button>
                    <button
                      id="preset-btn-wasd"
                      type="button"
                      onClick={() => selectPreset('wasd')}
                      className={`py-2 px-1 text-xs font-semibold rounded border transition-all ${
                        currentSettings.preset === 'wasd'
                          ? 'bg-red-950/40 border-red-500 text-red-400 shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-white'
                      }`}
                    >
                      WASD + F (ลุยด่าน)
                    </button>
                    <button
                      id="preset-btn-default"
                      type="button"
                      onClick={() => selectPreset('default')}
                      className={`py-2 px-1 text-xs font-semibold rounded border transition-all ${
                        currentSettings.preset === 'default'
                          ? 'bg-red-950/40 border-red-500 text-red-400 shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-white'
                      }`}
                    >
                      ปุ่มลูกศร + Shift
                    </button>
                  </div>
                </div>

                {/* Key Bindings List */}
                <div className="space-y-2.5 pt-2">
                  <label className="text-xs text-zinc-400 block font-medium">ปรับแต่งปุ่มด้วยตนเอง (คลิกที่ปุ่มแล้วกดบนคีย์บอร์ด):</label>
                  
                  {[
                    { key: 'left' as const, label: 'เดินซ้าย (Move Left)' },
                    { key: 'right' as const, label: 'เดินขวา (Move Right)' },
                    { key: 'jump' as const, label: 'กระโดดหลบบุญหลวง (Jump)' },
                    { key: 'attack' as const, label: 'ฟันดาบไม้ตาโขน (Attack / Slash)' },
                    { key: 'dash' as const, label: 'แดชพุ่งตัวหลบหลีก (Dash)' },
                  ].map((item) => (
                    <div 
                      key={item.key} 
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-850 hover:border-zinc-800 transition-colors"
                    >
                      <span className="text-sm text-zinc-300 font-medium">{item.label}</span>
                      <button
                        id={`btn-bind-${item.key}`}
                        onClick={() => {
                          audio.playClick();
                          setActiveBinding(item.key);
                        }}
                        className={`px-4 py-2 text-xs font-bold rounded min-w-[100px] border transition-all duration-150 uppercase tracking-wider ${
                          activeBinding === item.key
                            ? 'bg-amber-600 border-amber-500 text-white animate-pulse'
                            : 'bg-zinc-950 border-zinc-800 text-amber-500 hover:bg-zinc-900 hover:border-zinc-700'
                        }`}
                      >
                        {activeBinding === item.key ? 'กดปุ่มคีย์...' : currentSettings.keyBindings[item.key]}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIRTUAL SCREEN CONTROLS TAB */}
            {activeTab === 'virtual' && (
              <div className="space-y-4">
                {/* Toggle virtual buttons */}
                <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-850">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">เปิดปุ่มควบคุมบนหน้าจอ (Virtual Buttons)</span>
                    <span className="text-xs text-zinc-500 mt-0.5">แสดงปุ่มสัมผัสบนจอ สำหรับเล่นบนมือถือหรือทดสอบสกรีน</span>
                  </div>
                  <button
                    id="btn-toggle-virtual"
                    onClick={() => updateVirtualSettings('enabled', !currentSettings.virtualButtons.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 outline-none ${
                      currentSettings.virtualButtons.enabled ? 'bg-red-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        currentSettings.virtualButtons.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {currentSettings.virtualButtons.enabled && (
                  <div className="space-y-4 pt-2">
                    {/* Size Selector */}
                    <div>
                      <span className="text-xs text-zinc-400 block mb-1.5 font-medium">ขนาดปุ่มควบคุม:</span>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { size: 'sm', label: 'เล็ก (Small)' },
                          { size: 'md', label: 'กลาง (Medium)' },
                          { size: 'lg', label: 'ใหญ่ (Large)' }
                        ] as const).map((opt) => (
                          <button
                            id={`virtual-size-${opt.size}`}
                            key={opt.size}
                            onClick={() => updateVirtualSettings('size', opt.size)}
                            className={`py-2 px-1 text-xs rounded border font-semibold transition-all ${
                              currentSettings.virtualButtons.size === opt.size
                                ? 'bg-zinc-900 border-red-500 text-red-500'
                                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:bg-zinc-900/60'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Layout Selector */}
                    <div>
                      <span className="text-xs text-zinc-400 block mb-1.5 font-medium">สไตล์เลย์เอาต์ (Layout Style):</span>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { lay: 'split', label: 'แยกซ้ายขวา' },
                          { lay: 'classic-arcade', label: 'อาเขตคลาสสิก' },
                          { lay: 'right-aligned', label: 'ชิดขวาทั้งหมด' }
                        ] as const).map((opt) => (
                          <button
                            id={`virtual-layout-${opt.lay}`}
                            key={opt.lay}
                            onClick={() => updateVirtualSettings('layout', opt.lay)}
                            className={`py-2 px-1 text-xs rounded border font-semibold transition-all ${
                              currentSettings.virtualButtons.layout === opt.lay
                                ? 'bg-zinc-900 border-red-500 text-red-500'
                                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:bg-zinc-900/60'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Opacity Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-zinc-400 font-medium">ความโปร่งใสปุ่มกด (Opacity):</span>
                        <span className="text-xs text-red-400 font-bold font-mono">
                          {Math.round(currentSettings.virtualButtons.opacity * 100)}%
                        </span>
                      </div>
                      <input 
                        id="range-virtual-opacity"
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={currentSettings.virtualButtons.opacity}
                        onChange={(e) => updateVirtualSettings('opacity', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-0.5">
                        <span>10%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Labels Toggle */}
                    <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-900">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">แสดงข้อความกำกับบนปุ่มกด (Show Labels)</span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">แสดงข้อความคีย์ เช่น [SPACE], [LEFT] ประกอบไอคอน</span>
                      </div>
                      <button
                        id="btn-toggle-labels"
                        onClick={() => updateVirtualSettings('showLabels', !currentSettings.virtualButtons.showLabels)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 outline-none ${
                          currentSettings.virtualButtons.showLabels ? 'bg-red-600' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                            currentSettings.virtualButtons.showLabels ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Save & Reset Area */}
          <div className="p-4 border-t border-zinc-900 bg-zinc-900/20 flex gap-3 justify-end">
            <button 
              id="btn-reset-options"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-850 hover:border-zinc-750 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ค่าเริ่มต้น (Reset)</span>
            </button>
            <button 
              id="btn-save-options"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-black bg-gradient-to-r from-red-500 to-amber-500 rounded-lg shadow-md hover:from-red-600 hover:to-amber-600 transition-all cursor-pointer transform active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
