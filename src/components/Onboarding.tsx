/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Play, BookOpen, Trophy, X, HelpCircle, Sparkles } from "lucide-react";

interface OnboardingProps {
  onNext: () => void;
  onGoFullscreen: () => void;
  isFullscreen: boolean;
  onOpenLeaderboard?: () => void;
  layoutMode: "vertical" | "horizontal";
  setLayoutMode: (mode: "vertical" | "horizontal") => void;
}

export default function Onboarding({ onNext, onGoFullscreen, isFullscreen, onOpenLeaderboard, layoutMode, setLayoutMode }: OnboardingProps) {
  const [showHowTo, setShowHowTo] = useState(false);

  return (
    <div className="relative flex flex-col justify-between items-center w-full min-h-screen text-white bg-[#0b041a] overflow-y-auto p-6 md:p-8 select-none font-sans">
      {/* Decorative ambient background blur orbs */}
      <div className="absolute top-[15%] left-[5%] w-[45dvw] h-[45dvw] rounded-full bg-pink-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[5%] w-[45dvw] h-[45dvw] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

      {/* Spacer or tiny top element to push title to center */}
      <div className="w-full shrink-0 h-4" />

      {/* Main Centered Brand Logo/Content */}
      <div className="flex flex-col items-center justify-center text-center my-auto max-w-[420px] w-full z-10 py-6">
        {/* Colorful Gradient Party Icon */}
        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-cyan-500 rounded-full opacity-25 blur-xl animate-pulse" />
          <div className="absolute inset-2 bg-[#12082b]/95 border border-purple-500/30 rounded-full flex items-center justify-center shadow-lg shadow-purple-950/40">
            <svg 
              className="w-10 h-10 text-transparent bg-clip-text bg-gradient-to-tr from-pink-400 via-purple-400 to-cyan-400"
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              <path d="M2 2h20" />
            </svg>
          </div>
          <Sparkles className="absolute -top-1 -right-1 text-pink-400 w-5 h-5 animate-pulse" />
          <div className="absolute bottom-2 -left-1 text-cyan-400 text-lg">✦</div>
        </div>

        {/* GALLERY-BONDHUS Title */}
        <h1 className="text-4.5xl md:text-5xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 drop-shadow-[0_2px_15px_rgba(236,72,153,0.25)] select-all cursor-text font-sans">
          GALLERY-BONDHUS
        </h1>

        {/* Tagline */}
        <p className="text-sm text-gray-400 font-medium tracking-wide mt-4 px-2 leading-relaxed">
          The ultimate Bangladeshi charades-style party game! 🇧🇩
        </p>
      </div>

      {/* Primary and Secondary Action Buttons */}
      <div className="w-full max-w-[340px] flex flex-col gap-4 z-10 pb-6 shrink-0">
        {/* Play Layout Toggle Selection */}
        <div className="w-full bg-[#12082b] border border-pink-500/15 p-3 rounded-[20px] flex flex-col items-center justify-between text-center gap-2 shrink-0">
          <span className="text-xs font-bold text-pink-400 capitalize">Choose Play Layout</span>
          
          <div className="grid grid-cols-2 bg-[#090314]/90 p-1 rounded-xl w-full border border-pink-500/10">
            <button
              onClick={() => setLayoutMode("vertical")}
              className={`py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer uppercase ${
                layoutMode === "vertical"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Vertical
            </button>
            <button
              onClick={() => setLayoutMode("horizontal")}
              className={`py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer uppercase ${
                layoutMode === "horizontal"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Horizontal
            </button>
          </div>
          <span className="text-[10px] text-gray-500 font-medium">Horizontal works even with phone orientation lock ON.</span>
        </div>

        {/* Play Button - Large Primary Gradient */}
        <button
          onClick={onNext}
          className="w-full h-15 select-none flex items-center justify-center gap-3 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:opacity-95 text-white font-extrabold text-lg rounded-[20px] transition-all transform active:scale-97 cursor-pointer shadow-[0_5px_22px_rgba(139,92,246,0.35)] touch-manipulation"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Start Game</span>
        </button>

        {/* Side-by-side Secondary Buttons */}
        <div className="grid grid-cols-2 gap-3.5 w-full">
          {/* How to Play */}
          <button
            onClick={() => setShowHowTo(true)}
            className="h-12 select-none flex items-center justify-center gap-2 bg-transparent border border-pink-500/30 hover:border-pink-500/50 hover:bg-white/5 rounded-2xl text-pink-400 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer touch-manipulation"
          >
            <BookOpen className="w-4 h-4" />
            <span>How to Play</span>
          </button>

          {/* Leaderboard */}
          <button
            onClick={() => onOpenLeaderboard?.()}
            className="h-12 select-none flex items-center justify-center gap-2 bg-transparent border border-cyan-400/30 hover:border-cyan-400/50 hover:bg-white/5 rounded-2xl text-cyan-400 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer touch-manipulation"
          >
            <Trophy className="w-4 h-4" />
            <span>Leaderboard</span>
          </button>
        </div>

        {/* Ambient Hint Overlay */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-medium font-mono mt-3">
          <svg className="w-3.5 h-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
          </svg>
          <span>Act, guess & have fun!</span>
        </div>
      </div>

      {/* HOW TO PLAY DRAWER MODAL */}
      {showHowTo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in pointer-events-auto select-none font-sans">
          <div className="relative w-full max-w-md bg-[#12082b] border border-pink-500/30 rounded-[28px] p-6 shadow-2.5xl shadow-pink-950/20 text-left">
            <button
              onClick={() => setShowHowTo(false)}
              className="absolute top-5 right-5 bg-white/5 hover:bg-white/10 p-2 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 flex items-center gap-2 mb-5 font-sans">
              <HelpCircle className="w-5 h-5 text-pink-400" /> কীভাবে খেলবেন (How To Play)
            </h3>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 text-sm text-gray-300">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs font-black flex items-center justify-center shrink-0">1</div>
                <div>
                  <p className="font-bold text-white">দল ভাগ করুন (Divide Teams)</p>
                  <p className="text-xs text-gray-400 mt-1">২ বা তার বেশি খেলোয়াড় খেলুন। কপালে ফোন ধরা ব্যক্তি বাদে সবাই কার্ড দেখতে পাবে।</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-black flex items-center justify-center shrink-0">2</div>
                <div>
                  <p className="font-bold text-white">ইশারা দিয়ে বোঝান (Gesture)</p>
                  <p className="text-xs text-gray-400 mt-1">বন্ধুরা ইশারা, অঙ্গভঙ্গি ও ক্লু দিয়ে চোখের সামনে ধরা শব্দটি অনুমান করতে সাহায্য করবে!</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500 text-white text-xs font-black flex items-center justify-center shrink-0">3</div>
                <div>
                  <p className="font-bold text-white">স্কিপ ও সঠিক উত্তর (Skip & Correct)</p>
                  <ul className="text-xs text-gray-400 mt-1 space-y-1">
                    <li>• <strong className="text-pink-400">SKIP:</strong> স্ক্রিনের বাম অর্ধে চাপুন (Tap Left Half / Skip)।</li>
                    <li>• <strong className="text-cyan-400">CORRECT:</strong> স্ক্রিনের ডান অর্ধে চাপুন (Tap Right Half / Correct)।</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center shrink-0">4</div>
                <div>
                  <p className="font-bold text-white">সর্বোচ্চ স্কোর ট্র্যাকিং</p>
                  <p className="text-xs text-gray-400 mt-1">নির্ধারিত সময়ে সবচেয়ে বেশি সঠিক শব্দ অনুমান করুন আর পয়েন্ট লুফে নিন!</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowTo(false)}
              className="mt-6 w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-extrabold rounded-xl text-white cursor-pointer text-center text-xs tracking-wider uppercase shadow-[0_4px_12px_rgba(236,72,153,0.2)]"
            >
              বুঝতে পেরেছি! Start 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
