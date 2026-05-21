/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RotateCw, Maximize2, ShieldAlert } from "lucide-react";
import NeonCanvas from "./NeonCanvas";

interface PortraitWarningProps {
  onForceSideways: () => void;
  isForceRotated: boolean;
  onGoFullscreen: () => void;
}

export default function PortraitWarning({ onForceSideways, isForceRotated, onGoFullscreen }: PortraitWarningProps) {
  return (
    <div className="relative flex flex-col justify-center items-center w-full h-screen text-white bg-dark-party overflow-hidden px-6 text-center select-none">
      {/* Background neon shader particles */}
      <NeonCanvas glowColor="pink" intensity="normal" />

      {/* Decorative Orbs */}
      <div className="absolute top-20 left-10 w-44 h-44 rounded-full bg-neon-pink/20 blur-3xl" />
      <div className="absolute bottom-20 right-10 w-52 h-52 rounded-full bg-neon-blue/20 blur-3xl" />

      <div className="z-10 max-w-md w-full flex flex-col items-center">
        {/* Animated Phone Rotation Graphic */}
        <div className="relative mb-8 w-28 h-28 flex items-center justify-center bg-gray-900/40 rounded-full border border-neon-pink/30 shadow-lg shadow-neon-pink/10 animate-bounce-gentle">
          {/* Outer circle rotate arrow */}
          <RotateCw className="absolute inset-0 w-full h-full text-neon-pink/40 animate-[spin_4s_linear_infinite]" />
          
          {/* Rotating phone shape */}
          <div className="relative w-10 h-18 bg-gray-800 rounded-lg border-2 border-neon-blue flex flex-col items-center justify-between p-1 shadow-md shadow-neon-blue/30 animate-[wiggle_2s_ease-in-out_infinite]">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-600 self-center" />
            <div className="w-3.5 h-3.5 rounded-full border border-neon-green bg-neon-green/10 animate-ping" />
            <div className="w-4 h-1 bg-gray-700 rounded-xs" />
          </div>

          {/* Sparkle lines */}
          <div className="absolute -top-1 -right-1 text-neon-yellow font-bold text-xl animate-pulse">✦</div>
          <div className="absolute -bottom-1 -left-1 text-neon-blue font-bold text-lg animate-pulse">✦</div>
        </div>

        {/* Header Text */}
        <h1 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight pb-3 leading-snug text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue glow-text-pink font-sans">
          Gallery-Bondhus খেলতে আপনার ফোনটি কাত করুন
        </h1>

        {/* Subtitle Text */}
        <h2 className="text-sm sm:text-lg text-neon-blue font-semibold uppercase tracking-wider mb-2 font-display">
          Turn your phone to landscape to start the party!
        </h2>
        
        <p className="text-xs sm:text-sm text-gray-400 font-medium px-4 mb-8">
          বন্ধুদের সাথে সেরা গেমিং অভিজ্ঞতার জন্য ফোনটি ল্যান্ডস্কেপ (sideways) মোডে ধরুন এবং অটো-রোটেশন চালু আছে কিনা নিশ্চিত করুন।
        </p>

        {/* Control Buttons Container */}
        <div className="flex flex-col gap-4 w-full px-2">
          {/* Action 1: Toggle Canvas rotation workaround directly */}
          <button
            onClick={onForceSideways}
            className="group relative flex items-center justify-center gap-3 px-6 py-4.5 bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-pink hover:to-neon-purple rounded-xl font-bold text-white text-base tracking-wide transition-all duration-300 transform active:scale-95 shadow-md shadow-neon-pink/20 hover:shadow-neon-pink/50 cursor-pointer"
          >
            <span className="absolute -top-1.5 -right-1.5 bg-neon-yellow text-dark-party text-[10px] font-extrabold px-1.5 py-0.5 rounded-md animate-bounce">
              BYPASS
            </span>
            <RotateCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            <span>সোজা রেখেই খেলুন (sideways rotate)</span>
          </button>

          {/* Action 2: Go Fullscreen */}
          <button
            onClick={onGoFullscreen}
            className="flex items-center justify-center gap-3 px-6 py-3.5 bg-gray-900 hover:bg-gray-800 border-2 border-neon-blue/40 hover:border-neon-blue rounded-xl font-bold text-neon-blue hover:text-white transition-all duration-300 transform active:scale-95 cursor-pointer shadow-xs"
          >
            <Maximize2 className="w-4 h-4" />
            <span>ফুল-স্ক্রিন করুন / Fullscreen 🚀</span>
          </button>
        </div>

        {/* iOS Safari Assist Panel */}
        <div className="mt-8 p-4 rounded-xl bg-gray-950/70 border border-gray-800/60 text-left w-full">
          <div className="flex gap-2.5 items-start text-neon-yellow">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold font-display uppercase tracking-wider mb-1">
                iOS Safari / iPhone Users Guide:
              </p>
              <ul className="text-[11px] text-gray-500 list-disc pl-4 space-y-1">
                <li>আপনার ফোনের control center থেকে <strong className="text-gray-300">Portrait Orientation Lock</strong> বন্ধ করুন।</li>
                <li>অথবা উপরের <strong className="text-neon-pink">BYPASS</strong> বোতামটি দিয়ে ফোন সোজা রেখেই কাত করে খেলুন!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
