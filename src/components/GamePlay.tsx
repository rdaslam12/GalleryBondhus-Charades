/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, RefreshCw, XCircle, ChevronLeft, ChevronRight, Play, AlertTriangle, X, Clock } from "lucide-react";
import { Card, Category, CATEGORIES } from "../data";
import NeonCanvas from "./NeonCanvas";

interface GamePlayProps {
  cards: Card[];
  gameDuration: number; // in seconds
  foreheadMode: boolean; // true = mirrored or upright for friends to look, false = look at myself
  inputMode: "touch" | "motion";
  onGameEnd: (score: number, correct: number, skipped: number, answered: { id: string; word: string; status: "correct" | "skipped"; category: string }[]) => void;
  onExit: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export default function GamePlay({ cards, gameDuration, foreheadMode, inputMode, onGameEnd, onExit }: GamePlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameDuration);
  const [isMuted, setIsMuted] = useState(false);
  const [cardRotateY, setCardRotateY] = useState(0); // 3D flip trigger

  // Feedback FX states
  const [feedbackType, setFeedbackType] = useState<"none" | "correct" | "skipped">("none");
  const [particles, setParticles] = useState<Particle[]>([]);

  const lastTriggerTime = useRef<number>(0);
  const timerId = useRef<any>(null);
  const particleIdCounter = useRef(0);

  const activeCard = cards[currentIndex] || null;
  const activeCategory = activeCard ? CATEGORIES.find((c) => c.id === activeCard.category) : null;

  // Answer accumulator
  const answeredCardsRef = useRef<{ id: string; word: string; status: "correct" | "skipped"; category: string }[]>([]);

  // Compliant Game Over state calculator directly from Ref array to resolve stale React intervals
  const handleGameOver = () => {
    const correctCount = answeredCardsRef.current.filter((c) => c.status === "correct").length;
    const skippedCount = answeredCardsRef.current.filter((c) => c.status === "skipped").length;
    onGameEnd(correctCount, correctCount, skippedCount, answeredCardsRef.current);
  };

  // Sound FX synthesizers utilizing Web Audio API
  const synthCorrectSound = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  };

  const synthSkipSound = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(293.66, audioCtx.currentTime); // D4
      osc.frequency.exponentialRampToValueAtTime(146.83, audioCtx.currentTime + 0.2); // D3

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  };

  // Timer loop - Bulletproof 1-second interval sequence
  useEffect(() => {
    timerId.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId.current);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId.current);
  }, []);

  // Trigger correct selection
  const handleCorrect = () => {
    if (!activeCard) return;
    const now = Date.now();
    if (now - lastTriggerTime.current < 700) return; // Prevent multiple clicks
    lastTriggerTime.current = now;

    answeredCardsRef.current.push({
      id: activeCard.id,
      word: activeCard.word,
      status: "correct",
      category: activeCard.category
    });

    synthCorrectSound();
    setScore((s) => s + 1);
    setFeedbackType("correct");
    createCorrectExplosion();

    // Flip animation trigger
    setCardRotateY((r) => r + 180);

    // Vibration (where supported)
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    // Go next card or stop
    setTimeout(() => {
      setFeedbackType("none");
      if (currentIndex + 1 >= cards.length) {
        handleGameOver();
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 500);
  };

  // Trigger skip selection
  const handleSkip = () => {
    if (!activeCard) return;
    const now = Date.now();
    if (now - lastTriggerTime.current < 700) return;
    lastTriggerTime.current = now;

    answeredCardsRef.current.push({
      id: activeCard.id,
      word: activeCard.word,
      status: "skipped",
      category: activeCard.category
    });

    synthSkipSound();
    setFeedbackType("skipped");

    // Flip animation trigger
    setCardRotateY((r) => r - 180);

    if (navigator.vibrate) navigator.vibrate(150);

    setTimeout(() => {
      setFeedbackType("none");
      if (currentIndex + 1 >= cards.length) {
        handleGameOver();
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 500);
  };

  // Create emerald glowing bursts
  const createCorrectExplosion = () => {
    const fresh: Particle[] = [];
    const count = 35;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      fresh.push({
        id: particleIdCounter.current++,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 5 + 2,
        color: i % 2 === 0 ? "#39ff14" : "#00f0ff", // Emerald & Blue mix
        alpha: 1.0
      });
    }
    setParticles(fresh);
  };

  // Particle updates animator frame
  useEffect(() => {
    if (particles.length === 0) return;

    let animationId: number;
    const update = () => {
      setParticles((prev) => {
        const next = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1, // Gravity physics
            alpha: p.alpha - 0.025
          }))
          .filter((p) => p.alpha > 0);
        return next;
      });
      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [particles.length]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div
      className="relative flex flex-col justify-between items-center w-full text-white bg-[#0b041a] overflow-hidden select-none font-sans"
      style={{
        height: "var(--app-height, 100dvh)",
        paddingTop: "max(12px, env(safe-area-inset-top))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        paddingLeft: "max(16px, env(safe-area-inset-left))",
        paddingRight: "max(16px, env(safe-area-inset-right))"
      }}
    >
      
      {/* Glow overlays based on gesture feedbacks */}
      {feedbackType === "correct" && (
        <div className="absolute inset-0 bg-emerald-500/10 z-20 pointer-events-none transition-all duration-300 animate-pulse border-4 border-emerald-500" />
      )}
      {feedbackType === "skipped" && (
        <div className="absolute inset-0 bg-pink-500/10 z-20 pointer-events-none transition-all duration-300 animate-pulse border-4 border-pink-500" />
      )}
 
      {/* Floating dust backdrop */}
      <NeonCanvas glowColor={activeCategory?.glowColor.includes("pink") ? "pink" : activeCategory?.glowColor.includes("blue") ? "blue" : "purple"} intensity="normal" />
 
      {/* 2. REAL-TIME EMITTED PARTICLES GRAPHICS */}
      <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.radius * 2}px`,
              height: `${p.radius * 2}px`,
              backgroundColor: p.color,
              opacity: p.alpha,
              boxShadow: `0 0 10px ${p.color}`,
              transform: "translate(-50%, -50%)"
            }}
          />
        ))}
      </div>
 
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <div className="w-full max-w-[420px] flex justify-between items-center bg-white/5 border border-white/5 h-10 sm:h-12 px-3 rounded-2xl shrink-0 z-40 pointer-events-auto">
        <div className="flex items-center gap-3">
          {/* Time Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-xl border border-white/5 text-xs text-pink-400 font-bold font-mono">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>{formatTimer(timeLeft)}</span>
          </div>
 
          {/* Current Score Counter */}
          <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5 text-xs text-emerald-400 font-bold">
            <span>Score:</span>
            <span className="font-mono">{score.toString()}</span>
          </div>
        </div>
 
        {/* Categories Tag Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] text-gray-500 font-bold">
          <span>Card {currentIndex + 1} of {cards.length}</span>
        </div>
 
        {/* Right utility buttons */}
        <div className="flex items-center gap-2">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-8 h-8 select-none flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/5 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-pink-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
 
          {/* Escape exits */}
          <button
            onClick={onExit}
            className="w-8 h-8 select-none flex items-center justify-center bg-white/5 hover:bg-white/10 text-pink-400 rounded-xl border border-white/5 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
 
      {/* Massive Full-Screen Touch Zones (Left 50% = Skip, Right 50% = Correct) */}
      <div className="absolute inset-x-0 bottom-0 top-18 z-40 flex select-none pointer-events-auto">
        {/* Left 50% Touch Target: SKIP */}
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            handleSkip();
          }}
          className="w-1/2 h-full cursor-pointer hover:bg-pink-500/[0.01] active:bg-pink-500/[0.05] transition-all relative group"
          title="Tap anywhere on the left half to Skip"
        >
          {/* Ripple effects bar */}
          <div className="absolute inset-y-0 left-0 w-2.5 bg-pink-500/10 opacity-0 group-active:opacity-100 transition-opacity rounded-r-lg" />
        </div>
 
        {/* Right 50% Touch Target: CORRECT */}
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            handleCorrect();
          }}
          className="w-1/2 h-full cursor-pointer hover:bg-emerald-500/[0.01] active:bg-emerald-500/[0.05] transition-all relative group"
          title="Tap anywhere on the right half to Correct"
        >
          {/* Ripple effects bar */}
          <div className="absolute inset-y-0 right-0 w-2.5 bg-emerald-500/10 opacity-0 group-active:opacity-100 transition-opacity rounded-l-lg" />
        </div>
      </div>
 
      {/* 2. CARD CONTAINER */}
      <div className="flex-1 w-full max-w-[420px] flex flex-col justify-center items-center relative z-20 py-1 sm:py-2 pointer-events-none">
        {activeCard ? (
          <div className="perspective-1000 w-full h-[54vh] sm:h-[58vh] min-h-[140px] sm:min-h-[220px] max-h-[190px] sm:max-h-[300px] select-none relative pointer-events-none">
            
            {/* Real Rotating 3D card layout */}
            <div
              style={{ transform: `rotateY(${cardRotateY}deg)` }}
              className="relative w-full h-full preserve-3d transition-transform duration-500 bg-[#12082b]/80 rounded-[24px] sm:rounded-[32px] border border-white/5 shadow-2xl p-4 sm:p-5 select-none animate-fade-in flex flex-col justify-between"
            >
              
              {/* Backface / Frontface masks */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/2 via-transparent to-black/30 rounded-[24px] sm:rounded-[32px] pointer-events-none" />
 
              {/* Inner wrapper to counter-rotate container content so text is never mirrored */}
              <div
                style={{ transform: `rotateY(${-cardRotateY}deg) ${foreheadMode ? "scaleX(-1)" : ""}` }}
                className="w-full h-full flex flex-col justify-between text-center transition-transform duration-500 preserve-3d"
              >
                {/* CARD TOP TAG */}
                <div className="w-full flex justify-between items-center shrink-0">
                  <span className="text-[10px] font-bold tracking-wider text-pink-400 capitalize px-2 py-0.5 rounded-full bg-white/5">
                    {activeCategory?.nameEnglish}
                  </span>
                  
                  <span className="text-[10px] text-gray-500 font-bold">
                    {currentIndex + 1} OF {cards.length}
                  </span>
                </div>
 
                {/* CARD CENTRAL GUESS WORK */}
                <div className="my-auto py-1.5 sm:py-3 flex flex-col items-center">
                  <h3 className="text-2xl sm:text-3xl md:text-[42px] font-black tracking-wide text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)] leading-snug">
                    {activeCard.word}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-pink-400/90 font-medium tracking-wide mt-1.5 italic font-mono">
                    &ldquo; {activeCard.englishTranslit} &rdquo;
                  </p>
                  
                  {/* Gentle interactive Hint under title */}
                  {activeCard.funHint && (
                    <p className="hidden xs:block text-[9px] sm:text-[10px] text-gray-400/80 max-w-[280px] bg-white/2 px-2.5 py-1 rounded-lg mt-2 leading-relaxed border border-white/2 animate-fade-in truncate max-h-[44px] overflow-hidden">
                      💡 {activeCard.funHint}
                    </p>
                  )}
                </div>
 
                {/* CARD BOTTOM TABOOS WORDS LIST */}
                <div className="w-full border-t border-white/5 pt-2 sm:pt-3 shrink-0">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Forbidden Words
                  </p>
                  <div className="grid grid-cols-4 gap-1 sm:gap-1.5 select-none text-[9px] sm:text-[10px]">
                    {activeCard.tabooWords.map((taboo, ind) => (
                      <span
                        key={`${taboo}-${ind}`}
                        className="px-1.5 py-0.5 sm:py-1 font-bold bg-white/5 border border-white/5 rounded-lg sm:rounded-xl text-gray-300 truncate text-center"
                      >
                        {taboo}
                      </span>
                    ))}
                  </div>
                </div>
 
              </div>
 
            </div>
 
          </div>
        ) : (
          <p className="text-gray-500 font-sans italic text-xs">কার্ড ডেটা লোড হচ্ছে...</p>
        )}
      </div>
 
      {/* 3. GAMEPLAY GESTURES BAR (Interactive fallback tactile buttons) */}
      <div className="w-full max-w-[420px] grid grid-cols-2 gap-3 shrink-0 z-50 pointer-events-auto pb-1 sm:pb-2">
        {/* Skip button visual action panel */}
        <button
          onClick={handleSkip}
          className="h-11 sm:h-14 bg-gradient-to-r from-pink-500/10 to-red-500/5 hover:from-pink-500/20 hover:to-red-500/10 active:scale-95 transition-all text-white rounded-2xl border border-pink-500/30 flex flex-col justify-center items-center text-center px-2 cursor-pointer select-none"
        >
          <span className="text-[11px] sm:text-[12px] font-extrabold text-pink-400 uppercase tracking-wider leading-none">
            SKIP
          </span>
          <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold mt-1 leading-none uppercase">
            Tap Left = Skip
          </span>
        </button>

        {/* Correct button visual action panel */}
        <button
          onClick={handleCorrect}
          className="h-11 sm:h-14 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 hover:from-emerald-500/20 hover:to-teal-500/10 active:scale-95 transition-all text-white rounded-2xl border border-emerald-500/30 flex flex-col justify-center items-center text-center px-2 cursor-pointer select-none"
        >
          <span className="text-[11px] sm:text-[12px] font-extrabold text-emerald-400 uppercase tracking-wider leading-none">
            CORRECT
          </span>
          <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold mt-1 leading-none uppercase">
            Tap Right = Correct
          </span>
        </button>
      </div>
 
    </div>
  );
}
