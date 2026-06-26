import React from 'react';
import { HelpCircle, ArrowLeft, Keyboard, Smartphone, Award, ShieldAlert } from 'lucide-react';
import { audio } from '../utils/audio';
import { KeyBindings } from '../types';

interface HowToPlayProps {
  onBack: () => void;
  keyBindings: KeyBindings;
}

export default function HowToPlay({ onBack, keyBindings }: HowToPlayProps) {
  return (
    <div id="howtoplay-panel" className="relative flex flex-col w-full h-full text-white bg-black font-kanit p-4 md:p-6 select-none overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between z-10 border-b border-zinc-900 pb-3 mb-6">
        <button 
          id="btn-back-howtoplay"
          onClick={() => { audio.playClick(); onBack(); }}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-zinc-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>ย้อนกลับ</span>
        </button>
        <h2 className="text-xl md:text-2xl font-bold tracking-wider text-red-500 flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          <span>วิธีผจญภัยในด่านซ้าย</span>
        </h2>
        <div className="w-20"></div> {/* spacer */}
      </div>

      <div className="max-w-2xl mx-auto space-y-6 z-10">
        
        {/* Core Objective */}
        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl space-y-2">
          <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2">
            <Award className="w-5 h-5" />
            <span>เป้าหมายของเกม</span>
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            ผู้เล่นสวมบทบาทเป็น <strong>"ผู้กล้าผีตาโขน"</strong> ผู้ร่วมเฉลิมฉลองงานประเพณีบุญหลวงและการละเล่นผีตาโขนอันเลื่องชื่อของ อำเภอด่านซ้าย จังหวัดเลย! 
            คุณต้องวิ่งตะลุยเส้นทางผ่านเทือกเขา ท้องทุ่ง และวัดวาอาราม เพื่อเก็บสะสม 
            <strong>"กระติบข้าวเหนียวทองคำ"</strong> และกล่องวิเศษ พร้อมกระโดดหรือแดชหลบกระสุนวิญญาณป่า สิ่งกีดขวาง ท่อนไม้ และหนามแหลมคมพึ่งระวัง!
          </p>
        </div>

        {/* Dual Control explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Keyboard Controls */}
          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl space-y-3">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Keyboard className="w-4 h-4 text-red-500" />
              <span>การควบคุมด้วยคีย์บอร์ด</span>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm py-1 border-b border-zinc-900/60">
                <span className="text-zinc-400">เลื่อนไปซ้าย:</span>
                <kbd className="px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800 text-amber-400 uppercase font-bold font-mono">
                  {keyBindings.left}
                </kbd>
              </div>
              <div className="flex justify-between items-center text-sm py-1 border-b border-zinc-900/60">
                <span className="text-zinc-400">เลื่อนไปขวา:</span>
                <kbd className="px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800 text-amber-400 uppercase font-bold font-mono">
                  {keyBindings.right}
                </kbd>
              </div>
              <div className="flex justify-between items-center text-sm py-1 border-b border-zinc-900/60">
                <span className="text-zinc-400">กระโดดลอยตัว:</span>
                <kbd className="px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800 text-amber-400 uppercase font-bold font-mono">
                  {keyBindings.jump}
                </kbd>
              </div>
              <div className="flex justify-between items-center text-sm py-1 border-b border-zinc-900/60">
                <span className="text-zinc-400">ฟันดาบไม้ตาโขน (Attack):</span>
                <kbd className="px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800 text-amber-400 uppercase font-bold font-mono">
                  {keyBindings.attack}
                </kbd>
              </div>
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-zinc-400">แดชสายฟ้าเร่งความเร็ว:</span>
                <kbd className="px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800 text-amber-400 uppercase font-bold font-mono">
                  {keyBindings.dash}
                </kbd>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 italic mt-2">
              *คุณสามารถปรับแต่งปุ่มทั้งหมดนี้ได้ในเมนูการตั้งค่าตามความชอบ!
            </p>
          </div>

          {/* Virtual Buttons / Mobile Controls */}
          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl space-y-3">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Smartphone className="w-4 h-4 text-red-500" />
              <span>ปุ่มสัมผัสบนสกรีน (Touch)</span>
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              เมื่อเปิดใช้งาน <strong>Virtual Buttons</strong> ในหน้าตั้งค่า ปุ่มสัมผัสใสจะแสดงขึ้นมาด้านล่างจอ:
            </p>
            <ul className="space-y-1 text-xs text-zinc-400 list-disc list-inside">
              <li>ปุ่มลูกศรซ้ายขวาด้านซ้าย ใช้บังคับเลิศทิศทาง</li>
              <li>ปุ่มลูกศรขึ้นขนาดใหญ่ เพื่อกระโดด</li>
              <li>ปุ่มรูปสายฟ้าขวาล่าง สำหรับใช้ทักษะเร่งสปีดแดช</li>
            </ul>
            <p className="text-[11px] text-zinc-500 italic">
              *เหมาะกับการเล่นบนมือถือ แท็บเล็ต หรือผู้ที่ชื่นชอบอารมณ์เกมตู้อาเขตดั้งเดิม!
            </p>
          </div>

        </div>

        {/* Scoring items */}
        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl space-y-3">
          <h3 className="text-base font-bold text-amber-500 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span>คำแนะนำและคะแนน</span>
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex gap-2.5 items-center bg-zinc-900 p-2.5 rounded-lg">
              <span className="text-xl">🍙</span>
              <div>
                <strong className="block text-zinc-200">ข้าวเหนียวทองคำ</strong>
                <span className="text-zinc-500">+50 คะแนน</span>
              </div>
            </div>
            <div className="flex gap-2.5 items-center bg-zinc-900 p-2.5 rounded-lg">
              <span className="text-xl">👺</span>
              <div>
                <strong className="block text-zinc-200">หน้ากากวิเศษ</strong>
                <span className="text-zinc-500">+150 คะแนนส้มทอง</span>
              </div>
            </div>
            <div className="flex gap-2.5 items-center bg-zinc-900 p-2.5 rounded-lg">
              <span className="text-xl">🪵</span>
              <div>
                <strong className="block text-zinc-200">ท่อนไม้วิ่งชน</strong>
                <span className="text-zinc-500">ลดหัวใจความแรง 1 ดวง</span>
              </div>
            </div>
            <div className="flex gap-2.5 items-center bg-zinc-900 p-2.5 rounded-lg">
              <span className="text-xl">💜</span>
              <div>
                <strong className="block text-zinc-200">ภูติป่าช้าลอยฟ้า</strong>
                <span className="text-zinc-500">ลดหัวใจ 1 ดวงถ้วน (หลบหรือฟันกลับได้!)</span>
              </div>
            </div>
            <div className="flex gap-2.5 items-center bg-zinc-900 p-2.5 rounded-lg border border-red-950/50">
              <span className="text-xl">⚔️</span>
              <div>
                <strong className="block text-red-400 font-bold">ฟันดาบสยบภูติ</strong>
                <span className="text-zinc-300">กำจัดภูติผีร้ายสำเร็จ +100 คะแนน!</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
