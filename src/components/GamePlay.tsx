/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, RefreshCw, XCircle, ChevronLeft, ChevronRight, Play, AlertTriangle } from "lucide-react";
import { Card, Category, CATEGORIES } from "../data";
import NeonCanvas from "./NeonCanvas";

interface GamePlayProps {
  cards: Card[];
  gameDuration: number; // in seconds
  foreheadMode: boolean; // true = mirrored or upright for friends to look, false = look at myself
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

export default function GamePlay({ cards, gameDuration, foreheadMode, onGameEnd, onExit }: GamePlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameDuration);
  const [isMuted, setIsMuted] = useState(false);
  const [cardRotateY, setCardRotateY] = useState(0); // 3D flip trigger

  // Feedback FX states
  const [feedbackType, setFeedbackType] = useState<"none" | "correct" | "skipped">("none");
  const [particles, setParticles] = useState<Particle[]>([]);
  const [tiltPrompt, setTiltPrompt] = useState<"none" | "up" | "down">("none");
  const [mustRecenter, setMustRecenter] = useState(false); // require returning phone to center before triggering again

  // Gyroscope tracking refs
  const initialBetaRef = useRef<number | null>(null);
  const initialGammaRef = useRef<number | null>(null);
  const lastTriggerTime = useRef<number>(0);
  const timerId = useRef<any>(null);
  const particleIdCounter = useRef(0);

  const activeCard = cards[currentIndex] || null;
  const activeCategory = activeCard ? CATEGORIES.find((c) => c.id === activeCard.category) : null;

  // Answer accumulator
  const answeredCardsRef = useRef<{ id: string; word: string; status: "correct" | "skipped"; category: string }[]>([]);

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

  // Timer loop
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
  }, [currentIndex]);

  const handleGameOver = () => {
    // Compile and callbacks
    const correctCount = answeredCardsRef.current.filter((c) => c.status === "correct").length;
    const skippedCount = answeredCardsRef.current.filter((c) => c.status === "skipped").length;
    onGameEnd(score, correctCount, skippedCount, answeredCardsRef.current);
  };

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

  // Accelerometer / Gyroscope Tilting tracking effect
  useEffect(() => {
    const handleDeviceMotion = (e: DeviceOrientationEvent) => {
      const beta = e.beta;
      const gamma = e.gamma;
      if (beta === null || gamma === null) return;

      if (initialBetaRef.current === null || initialGammaRef.current === null) {
        initialBetaRef.current = beta;
        initialGammaRef.current = gamma;
        return;
      }

      const deltaBeta = beta - initialBetaRef.current;
      const deltaGamma = gamma - initialGammaRef.current;

      // In landscape mode, rotating left vs right swaps axis direction
      const orientationAngle = window.orientation !== undefined
        ? window.orientation
        : (window.screen && window.screen.orientation ? window.screen.orientation.angle : 90);

      let pitchChange = 0;
      if (Math.abs(orientationAngle) === 90 || orientationAngle === 270) {
        // Sideways holding: pitch corresponds to gamma axis change
        if (orientationAngle === -90 || orientationAngle === 270) {
          pitchChange = deltaGamma;
        } else {
          pitchChange = -deltaGamma;
        }
      } else {
        // Fallback for portrait orientation (or if angle was 0)
        pitchChange = deltaBeta;
      }

      const now = Date.now();

      // Cooldown safeguard
      if (now - lastTriggerTime.current < 1200) {
        // If we are waiting for recenter, check if alignment returns back near baseline
        if (mustRecenter && Math.abs(pitchChange) < 10) {
          setMustRecenter(false);
          setTiltPrompt("none");
        }
        return;
      }

      if (mustRecenter) {
        if (Math.abs(pitchChange) < 10) {
          setMustRecenter(false);
          setTiltPrompt("none");
        }
        return;
      }

      // Check Tilt DOWN (Tilted towards floor) -> CORRECT
      // Threshold: 22 degrees to avoid micro-accidents
      if (pitchChange > 22) {
        setTiltPrompt("down");
        setMustRecenter(true);
        handleCorrect();
      } 
      // Check Tilt UP (Tilted towards sky) -> SKIP
      else if (pitchChange < -22) {
        setTiltPrompt("up");
        setMustRecenter(true);
        handleSkip();
      }
    };

    window.addEventListener("deviceorientation", handleDeviceMotion);
    return () => {
      window.removeEventListener("deviceorientation", handleDeviceMotion);
    };
  }, [currentIndex, mustRecenter, isMuted]);

  // Reset baseline tilt on new card load
  useEffect(() => {
    initialBetaRef.current = null;
    initialGammaRef.current = null;
  }, [currentIndex]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="relative flex flex-col justify-between items-center w-full h-full text-white bg-dark-party overflow-hidden p-4 select-none font-sans select-none">
      
      {/* Glow overlays based on gesture feedbacks */}
      {feedbackType === "correct" && (
        <div className="absolute inset-0 bg-neon-green/18 z-20 pointer-events-none transition-all duration-300 animate-pulse border-4 border-neon-green" />
      )}
      {feedbackType === "skipped" && (
        <div className="absolute inset-0 bg-neon-pink/18 z-20 pointer-events-none transition-all duration-300 animate-pulse border-4 border-neon-pink" />
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
      <div className="w-full flex justify-between items-center bg-gray-950/70 border border-gray-800/60 p-2.5 px-4 rounded-xl shrink-0 z-10 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-dark-party text-neon-yellow border border-neon-yellow/30 px-3 py-1 rounded-lg text-xs font-mono font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-dark-party text-neon-green border border-neon-green/30 px-3 py-1 rounded-lg text-xs font-mono font-bold">
            <span>Score:</span>
            <span>{score.toString().padStart(2, "0")}</span>
          </div>
        </div>

        {/* Categories Tag Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-900/40 border border-gray-800 text-[10px] font-bold text-gray-400">
          <span>Card:</span>
          <span className="text-white font-mono">{currentIndex + 1} / {cards.length}</span>
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-2">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 bg-gray-900 hover:bg-gray-800 cursor-pointer text-gray-400 hover:text-white rounded-lg border border-gray-800 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-neon-pink" /> : <Volume2 className="w-4 h-4 text-neon-blue" />}
          </button>

          {/* Escape emergency exit */}
          <button
            onClick={onExit}
            className="flex items-center gap-1 text-xs font-black px-3 py-2 bg-neon-pink/15 hover:bg-neon-pink/30 border border-neon-pink/30 rounded-lg text-neon-pink cursor-pointer transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Massive Full-Screen Touch Zones (Left 50% = Skip, Right 50% = Correct) */}
      <div className="absolute inset-x-0 bottom-0 top-16 z-10 flex select-none pointer-events-auto">
        {/* Left 50% Touch Target: SKIP */}
        <div
          onClick={handleSkip}
          className="w-1/2 h-full cursor-pointer hover:bg-neon-pink/[0.01] active:bg-neon-pink/[0.08] transition-all relative group"
          title="Tap anywhere on the left half to Skip"
        >
          {/* Subtle tapping flash ripple guide */}
          <div className="absolute inset-y-0 left-0 w-2.5 bg-neon-pink/10 opacity-0 group-active:opacity-100 transition-opacity rounded-r-lg" />
        </div>

        {/* Right 50% Touch Target: CORRECT */}
        <div
          onClick={handleCorrect}
          className="w-1/2 h-full cursor-pointer hover:bg-neon-green/[0.01] active:bg-neon-green/[0.08] transition-all relative group"
          title="Tap anywhere on the right half to Correct"
        >
          {/* Subtle tapping flash ripple guide */}
          <div className="absolute inset-y-0 right-0 w-2.5 bg-neon-green/10 opacity-0 group-active:opacity-100 transition-opacity rounded-l-lg" />
        </div>
      </div>

      {/* 2. CARD AREAL CONTAINER */}
      <div className="w-full max-w-[480px] my-auto relative z-20 py-1 flex flex-col items-center pointer-events-none">
        {activeCard ? (
          <div className="perspective-1000 w-full h-[56vh] min-h-[220px] max-h-[295px] select-none relative pointer-events-none">
            
            {/* Real Rotating 3D card layout (pointer events disabled to clicks pass through to huge touch zones) */}
            <div
              style={{ transform: `rotateY(${cardRotateY}deg)` }}
              className="relative w-full h-full preserve-3d transition-transform duration-500 bg-card-dark rounded-3xl border-2 border-neon-purple/80 shadow-2xl shadow-neon-purple/20 p-4 select-none"
            >
              
              {/* Backface / Frontface masks */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-pink-950/20 rounded-3xl pointer-events-none" />

              {/* Inner wrapper to counter-rotate container content so text is never mirrored */}
              <div
                style={{ transform: `rotateY(${Math.abs(cardRotateY) % 360 !== 0 ? 180 : 0}deg)` }}
                className="w-full h-full flex flex-col justify-between text-center transition-transform duration-500 preserve-3d"
              >
                {/* CARD TOP TAG */}
                <div className="w-full flex justify-between items-center shrink-0">
                  <span className={`text-[9px] uppercase tracking-widest font-black ${activeCategory?.textColor} border border-current px-2 py-0.5 rounded-full bg-black/40`}>
                    {activeCategory?.nameEnglish}
                  </span>
                  
                  <span className="text-[9px] font-mono font-bold text-gray-500">
                    {currentIndex + 1} OF {cards.length}
                  </span>
                </div>

                {/* CARD CENTRAL GUESS WORK (Primary Bangla word) - overflow visible + leading-relaxed to protect glyph markers */}
                <div className={`my-auto py-2.5 flex flex-col items-center leading-relaxed overflow-visible transition-all ${foreheadMode ? "scale-x-[-1]" : ""}`}>
                  <h3 className="text-3xl sm:text-4xl md:text-[42px] font-black text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.35)] select-none py-1.5 px-1 block overflow-visible leading-relaxed md:leading-relaxed">
                    {activeCard.word}
                  </h3>
                  <p className="text-[10px] md:text-xs text-neon-blue font-bold font-mono tracking-widest uppercase mt-0.5">
                    &ldquo; {activeCard.englishTranslit} &rdquo;
                  </p>
                  
                  {/* Fun Hint */}
                  <div className="mt-2 max-w-[340px] bg-black/40 border border-gray-900 px-3 py-1 rounded-xl text-[9px] text-gray-400">
                    ⚡ {activeCard.funHint}
                  </div>
                </div>

                {/* CARD BOTTOM TABOOS WORDS LIST */}
                <div className="w-full border-t border-gray-900/60 pt-2 shrink-0">
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    নিচের শব্দগুলো বলা নিষিদ্ধ (Taboo Words):
                  </p>
                  <div className="grid grid-cols-4 gap-1 select-none">
                    {activeCard.tabooWords.map((taboo, ind) => (
                      <span
                        key={`${taboo}-${ind}`}
                        className="px-1.5 py-0.5 text-[9px] font-bold bg-gray-950/60 border border-gray-800 rounded-lg text-gray-400 truncate text-center"
                      >
                        {taboo}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Recenter alert graphic overlay */}
            {mustRecenter && (
              <div className="absolute inset-0 bg-dark-party/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 rounded-3xl border border-neon-yellow/30 animate-pulse z-40 pointer-events-auto">
                <AlertTriangle className="w-10 h-10 text-neon-yellow animate-[bounce_1.5s_infinite]" />
                <p className="text-sm font-black text-white mt-2">ফোনটি সোজা করুন (Return to Center)</p>
                <p className="text-[10px] text-gray-500 mt-1">Tilt detection resets once the screen alignment returns flat.</p>
              </div>
            )}

          </div>
        ) : (
          <p className="text-gray-500 font-sans italic text-xs">কার্ড ডেটা লোড হচ্ছে...</p>
        )}
      </div>

      {/* 3. GAMEPLAY GESTURES BAR (Bottom Panel Interface Indicator only, pointer events disabled to let background catch clicks) */}
      <div className="w-full grid grid-cols-2 gap-4 shrink-0 z-20 pointer-events-none opacity-90 sm:opacity-100">
        {/* Tilt Left / Tap left SKIP element */}
        <button
          onClick={handleSkip}
          className="flex flex-col items-center justify-center py-2 px-4 rounded-xl border border-neon-pink/30 hover:border-neon-pink/60 bg-neon-pink/5 hover:bg-neon-pink/10 transition-all cursor-pointer shadow-xs active:scale-97 group text-left"
        >
          <div className="flex items-center gap-1.5">
            <ChevronLeft className="w-4 h-4 text-neon-pink group-hover:translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase text-neon-pink tracking-wider">
              SKIP (<strong className="underline">Tilt Up</strong> / Tap Left)
            </span>
          </div>
          <span className="text-[8px] text-gray-500 font-medium">পরবর্তী নতুন কার্ডে যান</span>
        </button>

        {/* Tilt Down / Tap right CORRECT element */}
        <button
          onClick={handleCorrect}
          className="flex flex-col items-center justify-center py-2 px-4 rounded-xl border border-neon-green/30 hover:border-neon-green/60 bg-neon-green/5 hover:bg-neon-green/10 transition-all cursor-pointer shadow-xs active:scale-97 group text-right"
        >
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-xs font-black uppercase text-neon-green tracking-wider">
              CORRECT (<strong className="underline">Tilt Down</strong> / Tap Right)
            </span>
            <ChevronRight className="w-4 h-4 text-neon-green group-hover:translate-x-1 transition-transform" />
          </div>
          <span className="text-[8px] text-gray-500 font-medium">১ পয়েন্ট অর্জন করুন</span>
        </button>
      </div>

      {/* Center Background Cartoon sticker avatar */}
      <div className="absolute inset-x-0 bottom-16 pointer-events-none flex justify-center z-0 opacity-40">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 bg-gray-900 rounded-full border border-neon-blue flex items-center justify-center text-xs animate-pulse">
            🕶️
          </div>
          <span className="text-[9px] font-mono text-gray-600 mt-1 uppercase tracking-widest font-bold">Bondhu Core</span>
        </div>
      </div>

    </div>
  );
}
