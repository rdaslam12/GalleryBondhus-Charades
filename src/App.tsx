/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Sparkles, Play, Award, Tv, Utensils, Film, Info, Trash2, Eye, HelpCircle, ToggleLeft, ToggleRight, Loader, Compass, Moon, Sun, ArrowLeftRight, UserCheck } from "lucide-react";
import { CATEGORIES, DEFAULT_CARDS, Card, Category } from "./data";
import { normalizeCardKey, dedupeCards, removeRecentlyUsed, saveRecentlyUsed, getRecentlyUsedKeys, shuffleCards } from "./utils/cardQuality";
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
  const [inputMode, setInputMode] = useState<"touch" | "motion">("touch"); // New gameplay input mode!
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false); // Collapsible settings
  
  // AI Dynamic card builder params
  const [useAI, setUseAI] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiErrorToast, setAiErrorToast] = useState<string | null>(null);
  const [aiErrorModal, setAiErrorModal] = useState<{ title: string; message: string; isMissingKey: boolean } | null>(null);

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

  // Status/Debug tracker for the generated deck
  const [debugSourceInfo, setDebugSourceInfo] = useState<{
    source: "gemini" | "offline" | "fallback_mixed";
    requestedCount?: number;
    generatedCount?: number;
    uniqueCount?: number;
    duplicatesRemoved?: number;
    message?: string;
  } | null>(null);

  // Bridged to use the robust cardQuality helpers that store up to 400 items
  const getRecentlyUsedWords = (): string[] => {
    return getRecentlyUsedKeys();
  };

  const saveRecentlyUsedWords = (newWords: string[]) => {
    const fakeCards = newWords.map((word, idx) => ({
      id: `rc-${Date.now()}-${idx}`,
      word,
      englishTranslit: word,
      tabooWords: [],
      category: "misc",
      funHint: ""
    }));
    saveRecentlyUsed(fakeCards);
  };

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

      try {
        const response = await fetch("/api/gemini/generate-cards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            selectedCategories,
            categoryNames: selectedCategories.map(catId => CATEGORIES.find(c => c.id === catId)?.nameEnglish || catId),
            customPrompt: customPrompt.trim(),
            count: 80, // Default to 80 cards requested
            excludeWords: getRecentlyUsedWords(),
            sessionSeed: `sess_${Math.random()}`,
            desiredMix: { banglaSouthAsian: 40, international: 45, wildcard: 15 }
          })
        });

        const data = await response.json();

        if (data.success && data.cards && data.cards.length > 0) {
          // Client-side guard for duplicate card words
          const cleanCardsTemp = dedupeCards(data.cards);
          const cleanCards = removeRecentlyUsed(cleanCardsTemp, getRecentlyUsedWords());

          if (cleanCards.length >= 30) {
            // Save recently used words
            saveRecentlyUsed(cleanCards);
            setActiveCardsDeck(shuffleCards(cleanCards));
            setDebugSourceInfo({
              source: "gemini",
              requestedCount: 80,
              generatedCount: data.generatedCount || data.cards.length,
              uniqueCount: cleanCards.length,
              duplicatesRemoved: data.duplicatesRemoved || (data.cards.length - cleanCards.length)
            });
            setScreen("game_play");
          } else {
            // Mixed fallback to meet requirement of minimum 50 cards
            const fallbackRaw = DEFAULT_CARDS.filter((card) =>
              selectedCategories.includes(card.category)
            );
            const uniqueFallback = dedupeCards(fallbackRaw);
            const unusedFallback = removeRecentlyUsed(uniqueFallback, getRecentlyUsedWords());
            const finalFallbackPool = unusedFallback.length >= 20 ? unusedFallback : uniqueFallback;

            const combinedList = [...cleanCards, ...finalFallbackPool];
            const fullyUniqueList = dedupeCards(combinedList);
            const finalDeck = shuffleCards(fullyUniqueList).slice(0, 50);

            saveRecentlyUsed(finalDeck);
            setActiveCardsDeck(finalDeck);
            setDebugSourceInfo({
              source: "fallback_mixed",
              requestedCount: 80,
              generatedCount: data.cards.length,
              uniqueCount: finalDeck.length,
              duplicatesRemoved: data.cards.length - cleanCards.length,
              message: "Mixed AI with offline fallback to ensure sufficient deck variety."
            });
            setScreen("game_play");
          }
        } else {
          // Render specific error modal rather than silent fallback!
          if (data.error === "missing_api_key") {
            setAiErrorModal({
              title: "Gemini API Key Missing 🔑",
              message: "Gemini API key missing on server/Render environment. Please configure GEMINI_API_KEY.",
              isMissingKey: true
            });
          } else {
            console.warn("AI generation did not return valid cards, using offline fallback", data);
            triggerFallbackGameplay("Gemini failed, playing offline.");
          }
        }
      } catch (err) {
        console.error("AI deck building error, falling back:", err);
        triggerFallbackGameplay("Gemini failed, using offline unique deck.");
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

      const uniqueFiltered = dedupeCards(filtered);
      const unusedUnique = removeRecentlyUsed(uniqueFiltered, getRecentlyUsedWords());
      const finalOfflinePool = unusedUnique.length >= 30 ? unusedUnique : uniqueFiltered;

      const finalDeck = shuffleCards(finalOfflinePool).slice(0, 50);
      saveRecentlyUsed(finalDeck);

      setActiveCardsDeck(finalDeck);
      setDebugSourceInfo({
        source: "offline",
        uniqueCount: finalDeck.length
      });
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
    const uniqueFiltered = dedupeCards(filtered);
    const unusedUnique = removeRecentlyUsed(uniqueFiltered, getRecentlyUsedWords());
    const finalOfflinePool = unusedUnique.length >= 30 ? unusedUnique : uniqueFiltered;

    const finalDeck = shuffleCards(finalOfflinePool).slice(0, 50);
    saveRecentlyUsed(finalDeck);

    setActiveCardsDeck(finalDeck);
    setDebugSourceInfo({
      source: "fallback_mixed",
      uniqueCount: finalDeck.length,
      message: msg
    });
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
      case "Sparkles": return <Sparkles className="w-4 h-4 shrink-0" />;
      case "Compass": return <Compass className="w-4 h-4 shrink-0" />;
      default: return <Sparkles className="w-4 h-4 shrink-0" />;
    }
  };

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
          <div className="relative flex flex-col justify-between items-center w-full h-full text-white bg-dark-party overflow-hidden p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] select-none font-sans">
            <NeonCanvas glowColor="purple" intensity="normal" />

            {/* AI Notification Float */}
            {aiErrorToast && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-neon-pink/95 backdrop-blur-md border-2 border-white/20 p-2 px-4 rounded-xl shadow-xl animate-bounce text-[10px] font-bold text-center flex items-center gap-1.5 max-w-[90%]">
                <span className="text-xs">⚠️</span>
                <span>{aiErrorToast}</span>
              </div>
            )}

            {/* AI Error Modal Dialog */}
            {aiErrorModal && (
              <div className="fixed inset-0 bg-dark-party/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-gray-950 border-2 border-neon-pink rounded-3xl p-5 text-left shadow-2xl shadow-neon-pink/15">
                  <h3 className="text-base font-black text-neon-pink mb-2 font-mono uppercase tracking-wider">
                    {aiErrorModal.title}
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed mb-6 font-medium">
                    {aiErrorModal.message}
                  </p>
                  
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => {
                        setAiErrorModal(null);
                        // Trigger offline fallback
                        triggerFallbackGameplay("Gemini API key missing, playing offline.");
                      }}
                      className="w-full py-3 bg-neon-pink hover:bg-neon-purple rounded-xl font-bold text-xs uppercase tracking-wider text-white text-center transition-all cursor-pointer active:scale-95 animate-pulse"
                    >
                      Continue with Offline Decks / অফলাইনে খেলি ☕
                    </button>
                    
                    <button
                      onClick={() => setAiErrorModal(null)}
                      className="w-full py-2.5 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-400 text-center transition-all cursor-pointer"
                    >
                      Cancel Setup / ফিরে যাই
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center w-full shrink-0 border-b border-gray-900 pb-1.5 z-10">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-neon-green animate-ping" />
                <h2 className="text-xs md:text-sm font-black tracking-wider bg-clip-text bg-gradient-to-r from-neon-purple to-neon-pink text-transparent font-sans uppercase">
                  Gallery-Bondhus Play Setup
                </h2>
              </div>
              <button
                onClick={() => setScreen("leaderboard_view")}
                className="text-[9px] md:text-[10px] font-black px-2.5 py-1 bg-neon-blue/15 hover:bg-neon-blue/30 border border-neon-blue/30 text-neon-blue hover:text-white rounded-lg transition-all cursor-pointer"
              >
                🏆 লিডারবোর্ড / LEADERBOARD
              </button>
            </div>

            {/* Simplified Layout - Height optimized, scrollable container with grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 w-full max-w-[840px] items-stretch my-auto min-h-[0px] flex-1 py-1 z-10 overflow-y-auto pr-0.5">
              
              {/* Left Column: Categories choosing (5 column span) */}
              <div className="md:col-span-5 p-3 bg-gray-950/75 border border-gray-800/60 rounded-2xl flex flex-col justify-between min-h-[160px]">
                <label className="text-[10px] text-neon-blue uppercase tracking-widest font-black self-start font-mono mb-2 shrink-0">
                  🎨 ক্যাটাগরি বাছাই / CHOOSE DECKS
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 flex-1 min-h-[0px]">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-2.5 rounded-xl text-left border flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 select-none ${
                          isSelected
                            ? `${cat.color} ${cat.borderColor} text-white shadow-md`
                            : "bg-gray-900/30 border-gray-900 text-gray-500 hover:border-gray-800"
                        }`}
                      >
                        <span className={`p-1.5 rounded-lg shrink-0 bg-black/40 ${isSelected ? cat.textColor : "text-gray-600"}`}>
                          {getCategoryIconComponent(cat.icon)}
                        </span>
                        <div className="flex-1 select-none leading-tight min-w-0">
                          <p className="text-xs font-black truncate">{cat.nameBangla}</p>
                          <p className="text-[9px] text-gray-400 font-bold truncate mt-0.5">{cat.nameEnglish}</p>
                        </div>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 ${
                          isSelected ? "border-green-400 bg-green-500 text-dark-party font-black" : "border-gray-750 bg-transparent"
                        }`}>
                          {isSelected && "✓"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Game inputs & timer configurations (7 column span) */}
              <div className="md:col-span-7 p-3 bg-gray-950/75 border border-gray-800/60 rounded-2xl flex flex-col justify-start space-y-3 min-h-[160px]">
                
                {/* Play Time setup with quick buttons to avoid complex scrolling/notching sliders */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center shrink-0">
                    <label className="text-[10px] font-bold text-neon-yellow uppercase tracking-widest block font-mono">
                      ⏰ খেলার সময় / PLAY TIME
                    </label>
                    <p className="text-xs font-black text-neon-yellow font-mono bg-neon-yellow/10 border border-neon-yellow/20 px-2 py-0.5 rounded-lg">
                      {Math.floor(gameDuration / 60)}:{(gameDuration % 60).toString().padStart(2, "0")}s
                    </p>
                  </div>
                  
                  {/* Big preset selectors for quick party-game touch */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[60, 90, 120, 180].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setGameDuration(dur)}
                        className={`py-2 rounded-xl text-xs font-black tracking-wider transition-all select-none cursor-pointer border ${
                          gameDuration === dur
                            ? "bg-neon-yellow text-dark-party border-neon-yellow font-black shadow-md shadow-neon-yellow/10"
                            : "bg-gray-905/60 border-gray-900 text-gray-400 hover:border-gray-805"
                        }`}
                      >
                        {dur}s
                      </button>
                    ))}
                  </div>

                  {/* Optional Step Fine-tune */}
                  <div className="flex justify-between items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setGameDuration((prev) => Math.max(30, prev - 15))}
                      className="px-2.5 py-0.5 bg-gray-900 active:scale-95 border border-gray-800 rounded-lg text-gray-400 font-extrabold text-[8px] sm:text-[9px]"
                    >
                      -15s
                    </button>
                    <span className="text-[9px] font-mono text-gray-500 font-semibold select-none">Fine Tune Time</span>
                    <button
                      type="button"
                      onClick={() => setGameDuration((prev) => Math.min(300, prev + 15))}
                      className="px-2.5 py-0.5 bg-gray-900 active:scale-95 border border-gray-800 rounded-lg text-gray-400 font-extrabold text-[8px] sm:text-[9px]"
                    >
                      +15s
                    </button>
                  </div>
                </div>

                {/* Input Control Mode selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neon-blue uppercase tracking-widest block font-mono text-left">
                    🎮 কন্ট্রোল মোড / INPUT MODE
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInputMode("touch")}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer select-none active:scale-95 ${
                        inputMode === "touch"
                          ? "bg-neon-blue/15 border-neon-blue text-white shadow-xs"
                          : "bg-gray-900/40 border-gray-900 hover:border-gray-850 text-gray-500"
                      }`}
                    >
                      <ArrowLeftRight className={`w-4 h-4 shrink-0 ${inputMode === "touch" ? "text-neon-blue" : "text-gray-500"}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-black leading-tight">Touch Taps</p>
                        <p className="text-[8px] sm:text-[9px] text-gray-400 mt-0.5 leading-none truncate">বাম=Skip, ডানে=Correct</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode("motion")}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer select-none active:scale-95 ${
                        inputMode === "motion"
                          ? "bg-neon-pink/15 border-neon-pink text-white shadow-xs"
                          : "bg-gray-900/40 border-gray-900 hover:border-gray-850 text-gray-500"
                      }`}
                    >
                      <Compass className={`w-4 h-4 shrink-0 ${inputMode === "motion" ? "text-neon-pink" : "text-gray-500"}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-black leading-tight">Sensors Tilt</p>
                        <p className="text-[8px] sm:text-[9px] text-gray-400 mt-0.5 leading-none truncate">উপরে=Skip, নিচে=Correct</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* AI Active toggle switch */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center bg-gray-900/40 p-2.5 border border-gray-900 rounded-xl">
                    <div className="text-left">
                      <p className="text-xs font-black text-white flex items-center gap-1.5 leading-none bg-indigo-950/20">
                        <span>🤖 Generate with Gemini AI</span>
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1">নতুন ডাইনামিক Gen-Z কার্ড বানান</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseAI(!useAI)}
                      className={`px-4 py-2 rounded-xl border text-[10px] font-black select-none cursor-pointer tracking-wider text-center transition-all active:scale-95 ${
                        useAI
                          ? "bg-neon-pink text-white border-neon-pink shadow-xs shadow-neon-pink/15 animate-pulse"
                          : "bg-gray-800 text-gray-500 border-gray-750 hover:border-gray-650"
                      }`}
                    >
                      {useAI ? "ACTIVE" : "OFFLINE"}
                    </button>
                  </div>
                </div>

                {/* Advanced Collapsible options */}
                <div className="space-y-1 text-left">
                  <button
                    type="button"
                    onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                    className="w-full text-left flex items-center justify-between text-[11px] text-gray-400 font-bold hover:text-white transition-colors cursor-pointer py-1"
                  >
                    <span>🛠️ উন্নত সেটিংস / ADVANCED CONFIGS</span>
                    <span>{isAdvancedExpanded ? "▲ Hide" : "▼ Show"}</span>
                  </button>
                  
                  {isAdvancedExpanded && (
                    <div className="p-3 bg-gray-950/95 border border-gray-900 rounded-xl space-y-2.5">
                      {/* Forehead mode trigger */}
                      <button
                        type="button"
                        onClick={() => setForeheadMode(!foreheadMode)}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all select-none w-full cursor-pointer active:scale-95 ${
                          foreheadMode 
                            ? "bg-neon-green/10 border-neon-green text-white shadow-xs" 
                            : "bg-gray-900/40 border-gray-900 hover:border-gray-850 text-gray-400"
                        }`}
                      >
                        <div className="text-left flex-1 leading-tight mr-2">
                          <p className={`font-extrabold text-[10px] ${foreheadMode ? "text-neon-green" : "text-white"}`}>
                            কপাল মোড / Forehead Mode Mirroring
                          </p>
                          <p className="text-[8px] sm:text-[9px] text-gray-500 mt-0.5">মিরর করে: ফোন কপালে ধরলে বন্ধুরা সোজা দেখবে!</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className={`font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider ${foreheadMode ? "bg-neon-green text-dark-party shrink-0" : "bg-gray-800 text-gray-500 shrink-0"}`}>
                            {foreheadMode ? "ON" : "OFF"}
                          </span>
                        </div>
                      </button>

                      {/* Custom Prompt Text Area */}
                      {useAI && (
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-bold text-neon-pink uppercase tracking-widest block font-mono">
                            Custom Prompt Instructions
                          </label>
                          <textarea
                            rows={1}
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="যেমন: অনলি হুমায়ূন আহমেদের নাটক, ৯০-এর দশকের কার্টুন বা চাটগাঁইয়া গালি..."
                            className="w-full text-[10px] p-2 rounded-lg bg-gray-900 border border-gray-800 focus:outline-none focus:border-neon-pink text-white resize-none"
                          />
                        </div>
                      )}
                      
                      {/* Reset AI caching histories */}
                      <div className="flex justify-between items-center text-[9px] text-gray-500">
                        <span>নিরাপদ ইউনিক কার্ডের জন্য হিস্ট্রি রিসেট দিন:</span>
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.removeItem("recently_used_words");
                            alert("হিস্ট্রি রিসেট সফল হয়েছে! ⚡");
                          }}
                          className="font-bold text-red-400 hover:text-red-300 cursor-pointer underline text-[10px]"
                        >
                          Reset AI History
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Launch Game Button */}
            <div className="w-full max-w-[420px] shrink-0 pointer-events-auto mt-2 space-y-2">
              <button
                onClick={handleStartGame}
                className="w-full flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-neon-green via-emerald-600 to-neon-blue text-dark-party hover:scale-103 active:scale-97 text-sm font-black rounded-2xl tracking-widest relative overflow-hidden cursor-pointer shadow-lg shadow-neon-green/20"
              >
                {/* Visual glow stream */}
                <div className="absolute inset-0 w-[50%] bg-white/20 -skew-x-[25deg] transform -translate-x-[250%] animate-shimmer" />

                <Play className="w-4 h-4 fill-current" />
                <span>গেমে ঢুকি! START MASTER GAME 🚀</span>
              </button>

              {/* Non-intrusive debug/validation indicator */}
              {debugSourceInfo && (
                <div className="flex flex-col items-center justify-center p-2 rounded-xl border border-gray-900 bg-gray-950/80 font-mono text-[9px] text-gray-400 select-none text-center">
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <span>📡 DECK STATUS:</span>
                    <span className={`font-black font-mono tracking-wider uppercase ${
                      debugSourceInfo.source === "gemini" 
                        ? "text-neon-green" 
                        : debugSourceInfo.source === "fallback_mixed"
                        ? "text-neon-yellow"
                        : "text-neon-blue"
                    }`}>
                      {debugSourceInfo.source === "gemini" 
                        ? "🟢 Gemini AI Active" 
                        : debugSourceInfo.source === "fallback_mixed"
                        ? "🟡 Gemini failed: using fallback (Mixed)"
                        : "🔵 Offline Fallback"}
                    </span>
                    {debugSourceInfo.uniqueCount !== undefined && (
                      <span className="text-gray-500">
                        ({debugSourceInfo.uniqueCount} cards)
                      </span>
                    )}
                  </div>
                  {debugSourceInfo.duplicatesRemoved !== undefined && debugSourceInfo.duplicatesRemoved > 0 && (
                    <p className="text-neon-pink font-semibold mt-0.5">
                      ✕ Filtered out {debugSourceInfo.duplicatesRemoved} duplicate cards
                    </p>
                  )}
                  {debugSourceInfo.message && (
                    <p className="text-gray-500 italic mt-0.5 leading-none">
                      {debugSourceInfo.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Loader Backdrop */}
            {isLoadingAI && (
              <div className="fixed inset-0 bg-dark-party/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fade-in text-center">
                <Loader className="w-12 h-12 text-neon-pink animate-spin mb-4" />
                <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-purple glow-text-pink animate-pulse">
                  মামা ক্যাটাগরি সাজানো হচ্ছে!
                </h3>
                <p className="text-sm font-semibold text-neon-blue mt-1 uppercase tracking-widest font-mono">
                  Gemini is crafting customized party cards...
                </p>
                <div className="mt-4 px-5 py-2.5 bg-gray-950/60 border border-gray-800 rounded-2xl text-xs text-gray-400 max-w-sm italic">
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
            inputMode={inputMode}
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
