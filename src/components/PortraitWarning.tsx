/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RotateCw, Info, Smartphone } from "lucide-react";

interface PortraitWarningProps {
  onForceSideways: () => void;
  isForceRotated: boolean;
  onGoFullscreen: () => void;
}

export default function PortraitWarning({ onForceSideways, isForceRotated, onGoFullscreen }: PortraitWarningProps) {
  return (
    <div className="relative flex flex-col justify-center items-center w-full min-h-screen text-white bg-[#0b041a] overflow-hidden px-6 pb-8 text-center select-none font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50dvw] h-[50dvw] rounded-full bg-pink-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50dvw] h-[50dvw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <div className="z-10 max-w-[420px] w-full flex flex-col items-center">
        {/* Large phone-rotate icon / visual at the top */}
        <div className="relative w-36 h-36 flex items-center justify-center mb-8">
          {/* Animated gradient spinning glow border */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 opacity-20 blur-xl animate-pulse" />
          
          {/* Outer rotate arrow with gradient path */}
          <svg className="absolute w-[124px] h-[124px] text-pink-500 animate-[spin_8s_linear_infinite]" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="arrow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <path
              d="M 50,10 A 40,40 0 1,1 15,35"
              fill="none"
              stroke="url(#arrow-grad)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Draw arrow head manually */}
            <path
              d="M 12,30 L 15,39 L 24,35"
              fill="url(#arrow-grad)"
            />
          </svg>

          {/* Sparkles / Stars surrounding */}
          <div className="absolute top-1 right-2 text-pink-400 text-lg animate-pulse">✦</div>
          <div className="absolute bottom-4 left-0 text-cyan-400 text-base animate-pulse">✦</div>
          <div className="absolute top-1/2 left-[-10px] text-purple-400 text-xs">✦</div>

          {/* Central Rotating Phone Shape */}
          <div className="relative w-11 h-20 bg-[#160c2d] rounded-[14px] border-2 border-cyan-400/80 shadow-[0_0_15px_rgba(34,211,238,0.3)] flex flex-col items-center justify-between p-1.5 animate-[wiggle_2.5s_ease-in-out_infinite]">
            {/* Speaker line */}
            <div className="w-4 h-1 bg-gray-700 rounded-full" />
            {/* Inner screen circle / glow */}
            <div className="w-5 h-5 rounded-full border border-pink-400/40 bg-pink-500/10 flex items-center justify-center shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
            </div>
            {/* Home button circle */}
            <div className="w-2.5 h-2.5 rounded-full border border-gray-600 bg-gray-800" />
          </div>
        </div>

        {/* Clear Title */}
        <h1 className="text-3xl font-black tracking-tight leading-tight mb-3 text-white max-w-[320px]">
          Rotate your phone to landscape
        </h1>

        {/* Short Subtitle Only */}
        <p className="text-sm text-gray-400 font-medium max-w-[300px] mb-10 leading-relaxed">
          Best experience in landscape mode for the full party fun!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 w-full">
          {/* Primary Button: Start in Landscape/Fullscreen */}
          <button
            onClick={onGoFullscreen}
            className="w-full h-14 select-none flex items-center justify-center gap-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-base rounded-[18px] tracking-wide transform active:scale-97 transition-all duration-150 cursor-pointer shadow-[0_4px_20px_rgba(236,72,153,0.3)] touch-manipulation"
          >
            <RotateCw className="w-5 h-5" />
            <span>Start in Landscape</span>
          </button>

          {/* Secondary Button: Continue Anyway/Bypass */}
          <button
            onClick={onForceSideways}
            className="w-full h-14 select-none flex items-center justify-center bg-transparent border border-gray-800 hover:bg-white/5 text-gray-300 hover:text-white font-semibold text-base rounded-[18px] tracking-wide transform active:scale-97 transition-all duration-150 cursor-pointer touch-manipulation"
          >
            <span>Continue Anyway</span>
          </button>
        </div>

        {/* Small iPhone / Safari Helper Note */}
        <div className="mt-12 flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Info className="w-4 h-4 text-gray-600 shrink-0" />
          <span>iPhone / Safari users: Portrait lock off</span>
        </div>
      </div>
    </div>
  );
}
