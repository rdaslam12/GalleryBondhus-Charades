/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Sparkles, Play, Award, Tv, Utensils, Film, Info, Trash2, Eye, HelpCircle, ToggleLeft, ToggleRight, Loader, Compass, Moon, Sun, ArrowLeftRight, UserCheck } from "lucide-react";
import { CATEGORIES, DEFAULT_CARDS, Card, Category } from "./data";
import Onboarding from "./components/Onboarding";
import GamePlay from "./components/GamePlay";
import GameSummary from "./components/GameSummary";
import Leaderboard, { LeaderboardEntry } from "./components/Leaderboard";
import PortraitWarning from "./components/PortraitWarning";
import NeonCanvas from "./components/NeonCanvas";

export default function App() {
  const [screen, setScreen] = useState<"onboarding" | "mode_select" | "game_play" | "game_summary" | "leaderboard_view">("onboarding");

  // Game setup parameters
  const [gameDuration, setGameDuration] = useState(90); // default 1:30
  const [foreheadMode, setForeheadMode] = useState(false); // forehead vs looking-normal setup
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["movies_series", "celebrities_creators", "dhaka_memes_slang", "food_culture"]);
  
  // AI Dynamic card builder params
  const [useAI, setUseAI] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiErrorToast, setAiErrorToast] = useState<string | null>(null);

  // Active game session indicators
  const [activeCardsDeck, setActiveCardsDeck] = useState<Card[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCorrectCount, setFinalCorrectCount] = useState(0);
  const [finalSkippedCount, setFinalSkippedCount] = useState(0);
  const [finalHistory, setFinalHistory] = useState<{ id: string; word: string; status: "correct" | "skipped"; category: string }[]>([]);

  // Scores state
  const [currentSessionScores, setCurrentSessionScores] = useState<LeaderboardEntry[]>([]);
  
  // Fullscreen, rotate constraints
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isForceRotated, setIsForceRotated] = useState(false); // CSS orientation lock workaround toggle

  // Detect orientation vertically
  useEffect(() => {
    const checkViewportSize = () => {
      const portraitState = window.innerHeight > window.innerWidth;
      setIsPortrait(portraitState);
    };

    window.addEventListener("resize", checkViewportSize);
    window.addEventListener("orientationchange", checkViewportSize);
    checkViewportSize(); // initial check

    // Listen to fullscreen changes too
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("resize", checkViewportSize);
      window.removeEventListener("orientationchange", checkViewportSize);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one checklist category active
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Fisher-Yates array shuffle helper
  const shuffleDeck = <T,>(arr: T[]): T[] => {
    const next = [...arr];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  };

  const handleGoFullscreen = () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed, standard sandbox preview active:", err);
    }
  };

  // Core Game Deck Launcher trigger
  const handleStartGame = async () => {
    // 1. If AI is toggled, call Gemini server API
    if (useAI) {
      setIsLoadingAI(true);
      setAiErrorToast(null);

      // Choose a placeholder category
      const chosenCat = selectedCategories[0] || "movies_series";
      const catInfo = CATEGORIES.find((c) => c.id === chosenCat);

      try {
        const response = await fetch("/api/gemini/generate-cards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            category: chosenCat,
            categoryNameBangla: catInfo?.nameBangla || "বিবিধ",
            categoryNameEnglish: catInfo?.nameEnglish || "Mixed",
            customPrompt: customPrompt.trim(),
            count: 30
          })
        });

        const data = await response.json();

        if (data.success && data.cards && data.cards.length > 0) {
          setActiveCardsDeck(shuffleDeck(data.cards));
          setScreen("game_play");
        } else {
          // Trigger fallback local deck synthesis & toast error
          const errMsg = data.error === "missing_api_key"
            ? "Gemini API-র চাবি নেই! অফলাইন ডেক দিয়ে চালু করা হচ্ছে ☕"
            : "Gemini ডেটা মেলেনি! অফলাইন ডেক দিয়ে চালানো হচ্ছে।";
          triggerFallbackGameplay(errMsg);
        }
      } catch (err) {
        console.error("AI deck building error:", err);
        triggerFallbackGameplay("সার্ভার কানেকশন এরর! অফলাইন ডেক দিয়ে চালু হচ্ছে মামুন! ⚡");
      } finally {
        setIsLoadingAI(false);
      }
    } else {
      // 2. Load Offline/Preloaded static cards deck
      const filtered = DEFAULT_CARDS.filter((card) =>
        selectedCategories.includes(card.category)
      );

      if (filtered.length === 0) {
        alert("দয়া করে অন্তত একটি ক্যাটাগরি বেছে নিন!");
        return;
      }

      // Shuffle and scale up cards count to ensure full engagement and variety
      const duplicatedDeck = [...filtered, ...filtered, ...filtered];
      setActiveCardsDeck(shuffleDeck(duplicatedDeck).slice(0, 50));
      setScreen("game_play");
    }
  };

  // Gracefully fallback to localized deck
  const triggerFallbackGameplay = (msg: string) => {
    setAiErrorToast(msg);
    setTimeout(() => {
      setAiErrorToast(null);
    }, 5500);

    const filtered = DEFAULT_CARDS.filter((card) =>
      selectedCategories.includes(card.category)
    );
    setActiveCardsDeck(shuffleDeck(filtered));
    setScreen("game_play");
  };

  // Game complete state management
  const handleGamePlayFinished = (
    score: number,
    correct: number,
    skipped: number,
    history: { id: string; word: string; status: "correct" | "skipped"; category: string }[]
  ) => {
    setFinalScore(score);
    setFinalCorrectCount(correct);
    setFinalSkippedCount(skipped);
    setFinalHistory(history);
    setScreen("game_summary");
  };

  // Save score locally
  const handleSaveScoreToLeaderboard = (name: string) => {
    const newEntry: LeaderboardEntry = {
      id: `score-${Date.now()}`,
      name: name,
      score: finalScore,
      date: new Date().toISOString().split("T")[0],
      categories: selectedCategories
    };

    // Append to session leaderboard
    setCurrentSessionScores((prev) => [newEntry, ...prev]);

    // Save to localStorage
    try {
      const stored = localStorage.getItem("gallery_bondhus_leaderboard");
      const list = stored ? JSON.parse(stored) : [];
      list.push(newEntry);
      localStorage.setItem("gallery_bondhus_leaderboard", JSON.stringify(list));
    } catch (e) {
      console.error("Error storing scoreboard entry:", e);
    }
  };

  // Play again - restart active gameplay with the same deck randomized
  const handlePlayAgain = () => {
    setActiveCardsDeck((curr) => shuffleDeck(curr));
    setScreen("game_play");
  };

  // Icon finder helper
  const getCategoryIconComponent = (key: string) => {
    switch (key) {
      case "Film": return <Film className="w-4 h-4 shrink-0" />;
      case "Tv": return <Tv className="w-4 h-4 shrink-0" />;
      case "Utensils": return <Utensils className="w-4 h-4 shrink-0" />;
      case "Sparkles":
      default:
        return <Sparkles className="w-4 h-4 shrink-0" />;
    }
  };

  // Dynamic orientation bypass checker
  const renderInteractiveScreen = () => {
    switch (screen) {
      case "onboarding":
        return (
          <Onboarding
            onNext={() => setScreen("mode_select")}
            onGoFullscreen={handleGoFullscreen}
            isFullscreen={isFullscreen}
          />
        );

      case "mode_select":
        return (
          <div className="relative flex flex-col justify-between items-center w-full h-full text-white bg-dark-party overflow-hidden p-4 select-none font-sans">
            <NeonCanvas glowColor="purple" intensity="normal" />

            {/* AI Notification Float */}
            {aiErrorToast && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-neon-pink/95 backdrop-blur-md border-2 border-white/20 p-2.5 px-5 rounded-2xl shadow-xl animate-[bounce_2s_infinite] text-xs font-bold text-center flex items-center gap-2 max-w-[90%]">
                <span className="text-sm">⚠️</span>
                <span>{aiErrorToast}</span>
              </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center w-full shrink-0 border-b border-gray-900 pb-2 z-10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-neon-green animate-ping" />
                <h2 className="text-xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-neon-purple to-neon-pink text-transparent font-sans uppercase">
                  Choose Game Setup
                </h2>
              </div>
              <button
                onClick={() => setScreen("leaderboard_view")}
                className="text-[10px] font-bold px-3 py-1 bg-neon-blue/15 hover:bg-neon-blue/30 border border-neon-blue/30 text-neon-blue hover:text-white rounded-lg transition-all cursor-pointer"
              >
                🏆 লিডারবোর্ড দেখুন / LEADERBOARD
              </button>
            </div>

            {/* Inner Dashboard Layout (Custom modes, parameters etc) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 w-full max-w-[680px] md:max-w-[780px] items-stretch my-auto min-h-[0px] flex-1 py-1.5 z-10 overflow-y-auto pr-0.5">
              
              {/* Left Column: Traditional Configuration */}
              <div className="md:col-span-4 p-3 bg-gray-950/75 border border-gray-800/60 rounded-2xl flex flex-col justify-around text-left">
                
                {/* 1. Timer Setup */}
                <div>
                  <label className="text-[10px] font-bold text-neon-yellow uppercase tracking-widest block font-mono">
                    ⏰ খেলার সময় / PLAY TIME
                  </label>
                  <p className="text-xl font-black text-white font-mono mt-0.5">
                    {Math.floor(gameDuration / 60)}:{((gameDuration % 60)).toString().padStart(2, "0")}{" "}
                    <span className="text-xs text-gray-500 font-sans font-semibold">Min</span>
                  </p>
                  
                  {/* Slider */}
                  <input
                    type="range"
                    min="30"
                    max="300"
                    step="30"
                    value={gameDuration}
                    onChange={(e) => setGameDuration(Number(e.target.value))}
                    className="w-full mt-1.5 h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-neon-pink"
                  />

                  {/* Fast Hotkeys */}
                  <div className="grid grid-cols-3 gap-1 mt-2 text-[8px] font-bold">
                    <button
                      onClick={() => setGameDuration(60)}
                      className={`py-1 text-center rounded bg-gray-900 border ${gameDuration === 60 ? 'border-neon-pink text-neon-pink font-extrabold shadow-sm' : 'border-gray-850 hover:border-gray-600 text-gray-400'}`}
                    >
                      1 Min
                    </button>
                    <button
                      onClick={() => setGameDuration(90)}
                      className={`py-1 text-center rounded bg-gray-900 border ${gameDuration === 90 ? 'border-neon-pink text-neon-pink font-extrabold shadow-sm' : 'border-gray-850 hover:border-gray-600 text-gray-400'}`}
                    >
                      1:30 Min
                    </button>
                    <button
                      onClick={() => setGameDuration(180)}
                      className={`py-1 text-center rounded bg-gray-900 border ${gameDuration === 180 ? 'border-neon-pink text-neon-pink font-extrabold shadow-sm' : 'border-gray-850 hover:border-gray-600 text-gray-400'}`}
                    >
                      3 Min
                    </button>
                  </div>
                </div>

                {/* 2. Forehead mirror toggle setup */}
                <div className="border-t border-gray-900 pt-2 flex flex-col justify-center">
                  <div className="flex justify-between items-center text-xs">
                    <div className="text-left pr-2">
                      <p className="font-extrabold text-white flex items-center gap-1">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-neon-blue shrink-0" />
                        <span>কপাল মোড / Forehead Mode</span>
                      </p>
                      <p className="text-[9px] text-gray-500 mt-0.5">Mirrors / turns cards upright so your friends describe it natively!</p>
                    </div>
                    <button
                      onClick={() => setForeheadMode(!foreheadMode)}
                      className="text-white hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
                    >
                      {foreheadMode ? (
                        <ToggleRight className="w-10 h-10 text-neon-green" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Center Column: Category Selection checklists */}
              <div className="md:col-span-5 p-3 bg-gray-950/75 border border-gray-800/60 rounded-2xl flex flex-col">
                <label className="text-[10px] text-neon-blue uppercase tracking-widest font-black self-start font-mono mb-2">
                  🎨 ক্যাটাগরি বাছাই / CHOOSE DECKS
                </label>

                <div className="flex-1 grid grid-cols-2 gap-2 min-h-[0px]">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-2 rounded-xl text-left border flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? `${cat.color} ${cat.borderColor} text-white shadow-md`
                            : "bg-gray-900/30 border-gray-900 text-gray-500 hover:border-gray-800"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className={`p-1 rounded-md bg-black/40 ${isSelected ? cat.textColor : "text-gray-600"}`}>
                            {getCategoryIconComponent(cat.icon)}
                          </span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] ${
                            isSelected ? "border-green-400 bg-green-500 text-dark-party font-black" : "border-gray-700 bg-transparent"
                          }`}>
                            {isSelected && "✓"}
                          </span>
                        </div>

                        <div className="mt-2 select-none">
                          <p className="text-[10px] font-black leading-tight truncate">{cat.nameBangla}</p>
                          <p className="text-[8px] text-gray-400 font-bold truncate mt-0.5">{cat.nameEnglish}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Dynamic AI prompt deck builder */}
              <div className="md:col-span-3 p-3 bg-gray-950/75 border border-purple-500/10 rounded-2xl flex flex-col justify-between text-left">
                <div className="flex justify-between items-center shrink-0">
                  <label className="text-[10px] text-neon-pink uppercase tracking-widest font-black font-mono">
                    🤖 AI DECK GENERator
                  </label>
                  <button
                    onClick={() => setUseAI(!useAI)}
                    className="text-white shrink-0 cursor-pointer"
                  >
                    {useAI ? (
                      <ToggleRight className="w-8 h-8 text-neon-pink" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-600" />
                    )}
                  </button>
                </div>

                <p className="text-[9px] text-gray-500 mt-1 leading-tight shrink-0">
                  {useAI 
                    ? "🤖 Gemini Dynamic Deck Generator handles content based on your prompt below!"
                    : "🔒 AI is disabled. Toggle on to harness Gemini and synthesize tailor-made Gen-Z decks!"}
                </p>

                <div className="flex-1 mt-2 shrink-0">
                  <textarea
                    rows={2}
                    disabled={!useAI}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="যেমন: অনলি হুমায়ূন আহমেদের নাটক, ৯০-এর দশকের কার্টুন বা চাটগাঁইয়া গালি..."
                    className="w-full text-[10px] p-1.5 rounded-lg bg-gray-900 border border-gray-800 focus:outline-none focus:border-neon-pink disabled:opacity-30 disabled:pointer-events-none text-white resize-none h-[50px]"
                  />
                </div>

                <div className="text-[8px] text-gray-600 block leading-none font-mono mt-1 shrink-0">
                  *AI generates fresh 30 cards per game using gemini-3.5-flash.
                </div>
              </div>

            </div>

            {/* Launch Game Button */}
            <div className="w-full max-w-[400px] shrink-0 pointer-events-auto mt-2">
              <button
                onClick={handleStartGame}
                className="w-full flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-neon-green via-emerald-600 to-neon-blue text-dark-party hover:scale-103 active:scale-97 hover:shadow-neon-green/30 transform transition-all duration-300 font-extrabold rounded-2xl tracking-widest text-sm relative overflow-hidden cursor-pointer"
              >
                {/* Visual glow stream */}
                <div className="absolute inset-0 w-[50%] bg-white/20 -skew-x-[25deg] transform -translate-x-[250%] animate-shimmer" />

                <Play className="w-4 h-4 fill-current" />
                <span>গেমে ঢুকি! START MASTER GAME 🚀</span>
              </button>
            </div>

            {/* Loader Backdrop */}
            {isLoadingAI && (
              <div className="fixed inset-0 bg-dark-party/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fade-in text-center">
                <Loader className="w-12 h-12 text-neon-pink animate-spin mb-4" />
                <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-purple glow-text-pink">
                  মামা ক্যাটাগরি সাজানো হচ্ছে!
                </h3>
                <p className="text-sm font-semibold text-neon-blue mt-1 uppercase tracking-widest font-mono">
                  Gemini is crafting customized party cards...
                </p>
                <div className="mt-4 px-5 py-2.5 bg-gray-950/60 border border-gray-800 rounded-2xl text-xs text-gray-500 max-w-sm italic">
                  &ldquo; dynamic Taboo word generation produces unique items for every team game. Please wait... &rdquo;
                </div>
              </div>
            )}
          </div>
        );

      case "game_play":
        return (
          <GamePlay
            cards={activeCardsDeck}
            gameDuration={gameDuration}
            foreheadMode={foreheadMode}
            onGameEnd={handleGamePlayFinished}
            onExit={() => setScreen("mode_select")}
          />
        );

      case "game_summary":
        return (
          <GameSummary
            score={finalScore}
            correctCount={finalCorrectCount}
            skippedCount={finalSkippedCount}
            answeredCards={finalHistory}
            onPlayAgain={handlePlayAgain}
            onNewGame={() => setScreen("mode_select")}
            onSaveScore={handleSaveScoreToLeaderboard}
            categoriesUsed={selectedCategories}
          />
        );

      case "leaderboard_view":
        return (
          <div className="w-full h-full p-4 relative text-white bg-dark-party font-sans flex flex-col justify-center items-center">
            <NeonCanvas glowColor="purple" intensity="normal" />
            <div className="w-full max-w-md z-10">
              <Leaderboard
                visible={screen === "leaderboard_view"}
                currentSessionScores={currentSessionScores}
                onBack={() => setScreen("mode_select")}
              />
            </div>
          </div>
        );

      default:
        return (
          <Onboarding
            onNext={() => setScreen("mode_select")}
            onGoFullscreen={handleGoFullscreen}
            isFullscreen={isFullscreen}
          />
        );
    }
  };

  // If in standard vertical portrait mode AND they haven't explicitly triggered the Sideways Rotater, display warning.
  if (isPortrait && !isForceRotated) {
    return (
      <PortraitWarning
        onGoFullscreen={handleGoFullscreen}
        isForceRotated={isForceRotated}
        onForceSideways={() => setIsForceRotated(true)}
      />
    );
  }

  return (
    <div
      id="gallery-bondhus-container"
      className={`relative w-full h-screen bg-dark-party text-white transition-all overflow-hidden ${
        isForceRotated && isPortrait ? "portrait-locked-rotated" : ""
      }`}
    >
      {/* Interactive content based on screen state */}
      {renderInteractiveScreen()}

      {/* Screen rotation emulator override trigger */}
      {isForceRotated && isPortrait && (
        <button
          onClick={() => setIsForceRotated(false)}
          className="fixed bottom-4 right-4 z-50 p-2 bg-neon-pink text-white hover:bg-neon-purple rounded-xl flex items-center gap-1 text-[10px] font-black tracking-wider uppercase shadow-lg shadow-neon-pink/20 transition-all pointer-events-auto cursor-pointer"
        >
          <span>Portrait Warning ফিরান</span>
        </button>
      )}
    </div>
  );
}
