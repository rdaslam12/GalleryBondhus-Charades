/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Check, Info, ShieldAlert, Sparkles, HelpCircle, Phone, X, Award, Eye } from "lucide-react";

interface OnboardingProps {
  onNext: () => void;
  onGoFullscreen: () => void;
  isFullscreen: boolean;
}

export default function Onboarding({ onNext, onGoFullscreen, isFullscreen }: OnboardingProps) {
  const [gyroStatus, setGyroStatus] = useState<"unchecked" | "granted" | "denied">("unchecked");
  const [showHowTo, setShowHowTo] = useState(false);
  const [isiOS, setIsiOS] = useState(false);

  useEffect(() => {
    // Basic iOS check
    const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsiOS(isSafariIOS);

    // If DeviceOrientation API doesn't exist (e.g. desktop), show granted/neutral so they aren't blocked
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setGyroStatus("granted");
    } else if (
      typeof (DeviceOrientationEvent as any).requestPermission !== "function"
    ) {
      // Android or other browsers that don't declare requestPermission
      setGyroStatus("granted");
    }
  }, []);

  const requestGyroPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const state = await (DeviceOrientationEvent as any).requestPermission();
        if (state === "granted") {
          setGyroStatus("granted");
          return true;
        } else {
          setGyroStatus("denied");
          return false;
        }
      } catch (err) {
        console.error("Device orientation request failed:", err);
        setGyroStatus("denied");
        return false;
      }
    } else {
      setGyroStatus("granted");
      return true;
    }
  };

  const handleStartInteraction = async () => {
    // Request sensors
    await requestGyroPermission();
    // Go simple state next
    onNext();
  };

  return (
    <div className="relative flex flex-col justify-between items-center w-full h-full text-white bg-dark-party overflow-y-auto p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] select-none font-sans">
      {/* 1. TOP TITLE DECORATION */}
      <div className="flex flex-col items-center shrink-0">
        <div className="flex items-center gap-1.5 bg-pink-950/40 border border-pink-500/20 px-3 py-0.5 rounded-full mb-1">
          <Sparkles className="w-3.5 h-3.5 text-neon-pink animate-pulse" />
          <span className="text-[10px] font-bold text-neon-pink uppercase tracking-widest font-mono">
            Bangladeshi Pop Culture Party Game
          </span>
        </div>
        <h1 className="text-4xl md:text-[46px] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue inline-block select-all cursor-all glow-text-pink leading-none filter drop-shadow-[0_2px_10px_rgba(255,0,127,0.3)]">
          GALLERY-BONDHUS
        </h1>
        <p className="text-[11px] md:text-sm text-gray-400 font-medium tracking-wide mt-1.5 max-w-[400px] text-center">
          The ultimate Bangladeshi charades-style party game! 🇧🇩
        </p>
      </div>

      {/* 2. MAIN CENTER CONTENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[620px] md:max-w-[700px] items-center my-auto px-2 min-h-[0px] flex-1">
        
        {/* Left Card: Hardware & Settings State Checklist */}
        <div className="p-4 bg-gray-950/70 border border-gray-800/60 rounded-2xl flex flex-col justify-center h-full max-h-[160px] md:max-h-none space-y-3">
          <h2 className="text-xs uppercase tracking-widest font-bold text-neon-blue font-display flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Hardware Calibration & Setup
          </h2>

          <div className="space-y-3.5">
            {/* Permission item - Orientation */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-950/40 flex items-center justify-center border border-pink-500/30 text-neon-pink">
                  <Phone className="w-4 h-4 rotate-12 animate-pulse" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Device Orientation Status</p>
                  <p className="text-[10px] text-gray-500">Detects tilts for steering and gameplay gestures</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {gyroStatus === "granted" ? (
                  <span className="bg-neon-green/10 border border-neon-green/30 text-neon-green p-1 rounded-full text-[10px]">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <button
                    onClick={requestGyroPermission}
                    className="px-2.5 py-1 text-[10px] font-bold bg-neon-purple text-white hover:bg-neon-pink rounded-lg cursor-pointer transition-colors"
                  >
                    GRANT ACC
                  </button>
                )}
              </div>
            </div>

            {/* Permission item - Fullscreen */}
            <div className="flex flex-col gap-2 p-3 bg-gray-900/40 border border-gray-800/40 rounded-xl text-xs w-full">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/40 flex items-center justify-center border border-blue-500/30 text-neon-blue">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Immersive Fullscreen Mode</p>
                    <p className="text-[10px] text-gray-500">Optimizes display sizing to prevent system margins</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {isFullscreen ? (
                    <span className="bg-neon-green/10 border border-neon-green/30 text-neon-green px-2 py-1 rounded text-[10px] font-bold">
                      ACTIVATED ✓
                    </span>
                  ) : (
                    <button
                      onClick={onGoFullscreen}
                      className="px-2.5 py-1 text-[10px] font-bold bg-neon-blue text-white hover:bg-neon-purple rounded-lg cursor-pointer transition-colors"
                    >
                      ACTIVATE
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-gray-500 text-center italic leading-tight">
              *If Fullscreen request is blocked or unsupported, click "Let&apos;s Play" below to play standard.
            </p>
          </div>
        </div>

        {/* Right Card: How to play preview */}
        <div className="p-4 bg-gray-950/70 border border-gray-800/60 rounded-2xl flex flex-col justify-around h-full max-h-[160px] md:max-h-none text-left">
          <div className="flex justify-between items-center">
            <h2 className="text-xs uppercase tracking-widest font-bold text-neon-yellow font-display flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-neon-yellow" /> How to Play Gallery-Bondhus
            </h2>
            <button
              onClick={() => setShowHowTo(true)}
              className="text-xs text-neon-pink hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <Eye className="w-3 h-3" /> বিস্তারিত পড়ুন
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-[10px] mt-2 select-none">
            <div className="bg-gray-900/60 p-2 rounded-xl border border-gray-800/40">
              <span className="text-neon-pink font-extrabold text-xs block">1</span>
              <p className="font-medium text-gray-400 leading-tight mt-0.5">Start & holds on forehead / display to friends</p>
            </div>
            <div className="bg-gray-900/60 p-2 rounded-xl border border-gray-800/40">
              <span className="text-neon-yellow font-extrabold text-xs block">2</span>
              <p className="font-medium text-gray-400 leading-tight mt-0.5">Tilt UP or tap Left to <strong className="text-neon-pink">SKIP</strong></p>
            </div>
            <div className="bg-gray-900/60 p-2 rounded-xl border border-gray-800/40">
              <span className="text-neon-blue font-extrabold text-xs block">3</span>
              <p className="font-medium text-gray-400 leading-tight mt-0.5">Tilt DOWN or tap Right to <strong className="text-neon-green">CORRECT</strong></p>
            </div>
            <div className="bg-gray-900/60 p-2 rounded-xl border border-gray-800/40">
              <span className="text-neon-cyan font-extrabold text-xs block">4</span>
              <p className="font-medium text-gray-300 leading-tight mt-0.5">Score peak points before timer clock ends!</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM BUTTONS ROW */}
      <div className="flex flex-col items-center gap-2 mt-2 w-full max-w-[400px] shrink-0 pointer-events-auto">
        <button
          onClick={onNext}
          className="w-full flex items-center justify-center gap-3 px-8 py-4.5 bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue hover:scale-103 active:scale-97 text-white font-black rounded-2xl tracking-wider text-base shadow-lg shadow-neon-purple/40 hover:shadow-neon-purple/70 transition-all duration-300 transform cursor-pointer animate-pulse-slow"
        >
          <span>খেলা শুরু করি! Let&apos;s Play! 🚀</span>
        </button>
        <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
          <span>🎮 Supports touch screen tap & phone gyroscope inputs.</span>
        </span>
      </div>

      {/* INSTRUCTIONS DRAWER MODAL */}
      {showHowTo && (
        <div className="fixed inset-0 bg-dark-party/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in pointer-events-auto select-none">
          <div className="relative w-full max-w-lg bg-card-dark border-2 border-neon-blue rounded-3xl p-5 shadow-2.5xl shadow-neon-blue/20 text-left">
            <button
              onClick={() => setShowHowTo(false)}
              className="absolute top-4 right-4 bg-gray-900 hover:bg-gray-800 p-1.5 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple flex items-center gap-2 font-display mb-4">
              <HelpCircle className="w-6 h-6 text-neon-blue" /> কীভাবে খেলবেন (How To Play)
            </h3>

            <div className="space-y-4 max-h-[220px] sm:max-h-[280px] overflow-y-auto pr-1 text-sm text-gray-300 font-medium">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neon-pink text-dark-party text-xs font-black flex items-center justify-center shrink-0">1</div>
                <div>
                  <p className="font-bold text-white">বন্ধুদের দল ভাগ করুন (Divide Teams)</p>
                  <p className="text-xs text-gray-400 mt-0.5">গেমটি ২ বা তার বেশি খেলোয়াড়ের সাথে খেলা যায়। একজন খেলোয়াড় ফোনটি নিজের কপালে অথবা চোখের সামনে ধরবেন (কপাল মোড / Forehead Mode) যাতে কেবল তার বন্ধুরা কার্ডটি দেখতে পায়।</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neon-yellow text-dark-party text-xs font-black flex items-center justify-center shrink-0">2</div>
                <div>
                  <p className="font-bold text-white">বন্ধুরা ইশারা দিয়ে বোঝাবে (Describe and Gesture)</p>
                  <p className="text-xs text-gray-400 mt-0.5">বন্ধুরা কার্ডের শব্দটি জোরে না বলে ইশারা, অঙ্গভঙ্গি ও অন্যান্য বর্ণনামূলক শব্দ দিয়ে কপালে ফোন ধরা ব্যক্তিটিকে শব্দটি ধারণা দিতে সাহায্য করবে!</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neon-blue text-dark-party text-xs font-black flex items-center justify-center shrink-0">3</div>
                <div>
                  <p className="font-bold text-white">স্কিপ ও সঠিক উত্তর ট্র্যাকিং (Tilt or Tap Gestures)</p>
                  <ul className="text-xs text-gray-400 mt-1 pl-4 list-disc space-y-1">
                    <li><strong className="text-neon-pink underline">SKIP করুন:</strong> ফোনটির মুখ আকাশের দিকে কাত করুন (<strong className="text-neon-pink">Tilt UP</strong>) অথবা স্ক্রিনের বাম পাশে আলতো চাপুন!</li>
                    <li><strong className="text-neon-green underline">CORRECT করুন:</strong> ফোনটির মুখ মাটির দিকে কাত করুন (<strong className="text-neon-green">Tilt DOWN</strong>) অথবা স্ক্রিনের ডান পাশে আলতো চাপুন!</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neon-green text-dark-party text-xs font-black flex items-center justify-center shrink-0">4</div>
                <div>
                  <p className="font-bold text-white">সময় শেষ হওয়ার আগে সর্বোচ্চ স্কোর! (Beat the timer!)</p>
                  <p className="text-xs text-gray-400 mt-0.5">নির্ধারিত সময়ের মধ্যে যত দ্রুত সম্ভব বেশি কার্ডের সঠিক অনুমান করুন! গেম শেষে আপনার অর্জিত পয়েন্টের লিডারবোর্ড রেকর্ড যুক্ত হবে।</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowTo(false)}
              className="mt-5 w-full py-3 bg-neon-blue hover:bg-neon-purple hover:scale-102 transform transition-all font-black rounded-xl text-dark-party cursor-pointer text-center text-xs tracking-wider uppercase"
            >
              Got it! Let&apos;s Play 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
