/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Sparkles, Play, Award, Tv, Utensils, Film, Info, Trash2, Eye, HelpCircle, ToggleLeft, ToggleRight, Loader, Compass, Moon, Sun, ArrowLeftRight, UserCheck, ArrowLeft, Clock, Fingerprint, Folder, Bot, ChevronUp, ChevronDown } from "lucide-react";
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
  const [layoutMode, setLayoutMode] = useState<"vertical" | "horizontal">(() => {
    const saved = localStorage.getItem("gallery_bondhus_layout_mode");
    return (saved === "vertical" || saved === "horizontal") ? saved : "vertical";
  });

  useEffect(() => {
    localStorage.setItem("gallery_bondhus_layout_mode", layoutMode);
  }, [layoutMode]);

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

  // Detect orientation vertically and update mobile-safe app height state/CSS variables
  useEffect(() => {
    const checkViewportSize = () => {
      const portraitState = window.innerHeight > window.innerWidth;
      setIsPortrait(portraitState);

      // Mobile safe height handling using Visual Viewport to handle iOS browser bars
      const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${h}px`);
    };

    window.addEventListener("resize", checkViewportSize);
    window.addEventListener("orientationchange", checkViewportSize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", checkViewportSize);
    }
    checkViewportSize(); // initial check

    // Listen to fullscreen changes too
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("resize", checkViewportSize);
      window.removeEventListener("orientationchange", checkViewportSize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", checkViewportSize);
      }
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
    const isHorizontalLayout = layoutMode === "horizontal";
    const maxWidthClass = isHorizontalLayout ? "max-w-[620px]" : "max-w-[420px]";

    switch (screen) {
      case "onboarding":
        return (
          <Onboarding
            onNext={() => setScreen("mode_select")}
            onGoFullscreen={handleGoFullscreen}
            isFullscreen={isFullscreen}
            onOpenLeaderboard={() => setScreen("leaderboard_view")}
            layoutMode={layoutMode}
            setLayoutMode={setLayoutMode}
            isPortrait={isPortrait}
          />
        );

      case "mode_select":
        return (
          <div
            className="relative flex flex-col justify-between items-center w-full text-white bg-[#0b041a] overflow-hidden select-none font-sans"
            style={{
              height: isHorizontalLayout && isPortrait ? "100%" : "var(--app-height, 100dvh)",
              paddingTop: "max(12px, env(safe-area-inset-top))",
              paddingBottom: "max(12px, env(safe-area-inset-bottom))",
              paddingLeft: "max(16px, env(safe-area-inset-left))",
              paddingRight: "max(16px, env(safe-area-inset-right))"
            }}
          >
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
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-[#12082b] border border-pink-500/30 rounded-3xl p-5 text-left shadow-2xl shadow-pink-950/15">
                  <h3 className="text-base font-black text-pink-400 mb-2 font-mono uppercase tracking-wider">
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
                      className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold text-xs uppercase tracking-wider text-white text-center transition-all cursor-pointer active:scale-95 shadow-md shadow-pink-500/20"
                    >
                      Continue Offline / অফলাইনে খেলি ☕
                    </button>
                    
                    <button
                      onClick={() => setAiErrorModal(null)}
                      className="w-full py-2.5 bg-gray-900 border border-gray-800 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-400 text-center transition-all cursor-pointer"
                    >
                      Cancel Setup / ফিরে যাই
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Minimal Setup Top Bar Header */}
            <div className={`flex justify-between items-center w-full ${maxWidthClass} shrink-0 pb-2 sm:pb-3 z-10`}>
              <button
                onClick={() => setScreen("onboarding")}
                className="w-10 h-10 select-none flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-full transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-black tracking-widest text-gray-300 font-sans uppercase">
                SETUP
              </h2>
              {/* Leaderboard launcher fallback */}
              <button
                onClick={() => setScreen("leaderboard_view")}
                className="w-10 h-10 select-none flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-full transition-all cursor-pointer shrink-0 text-cyan-400"
              >
                <Award className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Simple Setup Form Grid / Panel */}
            <div className={`flex-1 w-full ${maxWidthClass} overflow-y-auto pr-1 z-10 scrollbar-thin my-auto`}>
              {isHorizontalLayout ? (
                <div className="grid grid-cols-2 gap-3.5 items-start text-left">
                  {/* Left Column */}
                  <div className="space-y-3">
                    {/* 1. Play Time Section */}
                    <div className="p-3 bg-[#12082b] border border-pink-500/10 rounded-[18px] space-y-2">
                      <div className="flex items-center gap-1.5 text-pink-400 font-bold text-[11px] uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-pink-500" />
                        <span>Play Time</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[60, 90, 120].map((dur) => (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => setGameDuration(dur)}
                            className={`h-9 select-none flex items-center justify-center text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                              gameDuration === dur
                                ? "bg-transparent border-pink-500 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.15)]"
                                : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                            }`}
                          >
                            {dur}s
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Touch Mode Active Indicator */}
                    <div className="p-2.5 bg-[#12082b] border border-cyan-400/10 rounded-[16px] flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px] uppercase tracking-wider">
                        <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Touch controls active</span>
                      </div>
                      <span className="text-[9px] text-gray-500 uppercase font-bold pr-1">Enabled</span>
                    </div>

                    {/* 4. AI Deck Toggle */}
                    <div className="p-3 bg-[#12082b] border border-pink-500/10 rounded-[18px] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-gray-350 font-bold text-[11px] uppercase tracking-wider">
                        <Bot className="w-3.5 h-3.5 text-purple-400" />
                        <div className="flex flex-col text-left">
                          <span>AI Deck</span>
                          <span className="text-[9px] text-gray-500 lowercase leading-tight font-medium">Smart word suggestions</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUseAI(!useAI)}
                        className="focus:outline-none cursor-pointer"
                      >
                        {useAI ? (
                          <div className="w-10 h-5.5 bg-pink-500 rounded-full p-0.5 transition-colors duration-200 flex justify-end">
                            <div className="w-4.5 h-4.5 bg-white rounded-full shadow-md" />
                          </div>
                        ) : (
                          <div className="w-10 h-5.5 bg-gray-800 rounded-full p-0.5 transition-colors duration-200 flex justify-start">
                            <div className="w-4.5 h-4.5 bg-gray-500 rounded-full shadow-md" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    {/* 3. Category Section */}
                    <div className="p-3 bg-[#12082b] border border-purple-500/10 rounded-[18px] space-y-2">
                      <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[11px] uppercase tracking-wider">
                        <Folder className="w-3.5 h-3.5 text-purple-400" />
                        <span>Category</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {CATEGORIES.map((cat) => {
                          const isSelected = selectedCategories.includes(cat.id);
                          let simpleLabel = "";
                          if (cat.id === "movies_series") simpleLabel = "Movies";
                          else if (cat.id === "celebrities_creators") simpleLabel = "Celebrities";
                          else if (cat.id === "dhaka_memes_slang") simpleLabel = "Memes";
                          else if (cat.id === "food_culture") simpleLabel = "Food";
                          else simpleLabel = cat.nameEnglish;

                          return (
                            <button
                              key={cat.id}
                              onClick={() => toggleCategory(cat.id)}
                              className={`h-9 select-none flex items-center gap-2 px-2 rounded-xl transition-all border cursor-pointer text-left ${
                                isSelected
                                  ? "bg-transparent border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                                  : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                              }`}
                            >
                              <span className="shrink-0 scale-90">
                                {getCategoryIconComponent(cat.icon)}
                              </span>
                              <span className="text-[11px] font-bold truncate leading-none">
                                {simpleLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 5. Advanced Collapsible Options */}
                    <div className="border-t border-white/5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                        className="w-full text-left flex items-center justify-between text-[10px] text-gray-500 font-bold hover:text-white transition-colors cursor-pointer py-1.5 px-1"
                      >
                        <span>Advanced (optional)</span>
                        {isAdvancedExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      
                      {isAdvancedExpanded && (
                        <div className="p-2.5 bg-[#12082b]/80 border border-white/5 rounded-xl mt-1 space-y-2 text-left">
                          <button
                            type="button"
                            onClick={() => setForeheadMode(!foreheadMode)}
                            className={`p-1.5 rounded-lg border text-left flex items-center justify-between transition-all select-none w-full cursor-pointer active:scale-95 text-[10px] ${
                              foreheadMode 
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
                                : "bg-white/5 border-transparent text-gray-400"
                            }`}
                          >
                            <div className="text-left flex-1 mr-1">
                              <p className="font-bold text-[10px]">Forehead Mode</p>
                              <p className="text-[8px] text-gray-500 mt-0.5 leading-tight">Mirror text direction</p>
                            </div>
                            <span className={`font-bold text-[8px] px-1 py-0.5 rounded ${foreheadMode ? "bg-emerald-400 text-black" : "bg-gray-800 text-gray-500"}`}>
                              {foreheadMode ? "ON" : "OFF"}
                            </span>
                          </button>

                          {useAI && (
                            <div className="space-y-0.5 text-left">
                              <label className="text-[8px] font-bold text-pink-400 uppercase block font-sans">Instruction Prompt</label>
                              <input
                                type="text"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="90s, dhaka slang..."
                                className="w-full text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-white font-medium"
                              />
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[9px] text-gray-500 pt-1">
                            <span>Seen list:</span>
                            <button
                              type="button"
                              onClick={() => {
                                localStorage.removeItem("recently_used_words");
                                alert("History cleared! ⚡");
                              }}
                              className="font-bold text-pink-400/80 hover:text-pink-400 underline cursor-pointer"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-[15px] w-full text-left">
                  {/* 1. Play Time Section */}
                  <div className="p-4 bg-[#12082b] border border-pink-500/10 rounded-[22px] space-y-3">
                    <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-pink-500" />
                      <span>Play Time</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[60, 90, 120].map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setGameDuration(dur)}
                          className={`h-11 select-none flex items-center justify-center text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                            gameDuration === dur
                              ? "bg-transparent border-pink-500 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.15)]"
                              : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          {dur}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Touch Mode Active Indicator */}
                  <div className="p-3 bg-[#12082b] border border-cyan-400/10 rounded-[20px] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-[11px] uppercase tracking-wider">
                      <Fingerprint className="w-4 h-4 text-cyan-400" />
                      <span>Touch controls active</span>
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold pr-1">Enabled</span>
                  </div>

                  {/* 3. Category Section */}
                  <div className="p-4 bg-[#12082b] border border-purple-500/10 rounded-[22px] space-y-3">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                      <Folder className="w-4 h-4 text-purple-400" />
                      <span>Category</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {CATEGORIES.map((cat) => {
                        const isSelected = selectedCategories.includes(cat.id);
                        let simpleLabel = "";
                        if (cat.id === "movies_series") simpleLabel = "Movies";
                        else if (cat.id === "celebrities_creators") simpleLabel = "Celebrities";
                        else if (cat.id === "dhaka_memes_slang") simpleLabel = "Memes";
                        else if (cat.id === "food_culture") simpleLabel = "Food";
                        else simpleLabel = cat.nameEnglish;

                        return (
                          <button
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className={`h-11 select-none flex items-center gap-2.5 px-3 rounded-xl transition-all border cursor-pointer text-left ${
                              isSelected
                                ? "bg-transparent border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                                : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                            }`}
                          >
                            <span className="shrink-0">
                              {getCategoryIconComponent(cat.icon)}
                            </span>
                            <span className="text-xs font-bold truncate leading-none">
                              {simpleLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. AI Deck Toggle */}
                  <div className="p-4 bg-[#12082b] border border-pink-500/10 rounded-[22px] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-350 font-bold text-xs uppercase tracking-wider">
                      <Bot className="w-4 h-4 text-purple-400" />
                      <div className="flex flex-col text-left">
                        <span>AI Deck</span>
                        <span className="text-[10px] text-gray-500 lowercase leading-tight font-medium">Smart word suggestions</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseAI(!useAI)}
                      className="focus:outline-none cursor-pointer"
                    >
                      {useAI ? (
                        <div className="w-11 h-6 bg-pink-500 rounded-full p-0.5 transition-colors duration-200 flex justify-end">
                          <div className="w-5 h-5 bg-white rounded-full shadow-md" />
                        </div>
                      ) : (
                        <div className="w-11 h-6 bg-gray-800 rounded-full p-0.5 transition-colors duration-200 flex justify-start">
                          <div className="w-5 h-5 bg-gray-500 rounded-full shadow-md" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* 5. Advanced Collapsible Options */}
                  <div className="border-t border-white/5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                      className="w-full text-left flex items-center justify-between text-xs text-gray-500 font-bold hover:text-white transition-colors cursor-pointer py-2 px-1"
                    >
                      <span>Advanced (optional)</span>
                      {isAdvancedExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {isAdvancedExpanded && (
                      <div className="p-3.5 bg-[#12082b]/80 border border-white/5 rounded-2xl mt-1 space-y-3 font-sans">
                        <button
                          type="button"
                          onClick={() => setForeheadMode(!foreheadMode)}
                          className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all select-none w-full cursor-pointer active:scale-95 ${
                            foreheadMode 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
                              : "bg-white/5 border-transparent text-gray-400"
                          }`}
                        >
                          <div className="text-left flex-1 mr-2">
                            <p className="font-bold text-[11px]">
                              Forehead Mode Mirroring
                            </p>
                            <p className="text-[9px] text-gray-500 leading-none mt-1">Mirror word display side to help friends read</p>
                          </div>
                          <span className={`font-bold text-[9px] px-1.5 py-0.5 rounded uppercase ${foreheadMode ? "bg-emerald-400 text-black animate-pulse" : "bg-gray-800 text-gray-500"}`}>
                            {foreheadMode ? "ON" : "OFF"}
                          </span>
                        </button>

                        {useAI && (
                          <div className="space-y-1 text-left">
                            <label className="text-[9px] font-bold text-pink-400 uppercase tracking-widest block font-sans">
                              AI Focus Instruction prompt
                            </label>
                            <input
                              type="text"
                              value={customPrompt}
                              onChange={(e) => setCustomPrompt(e.target.value)}
                              placeholder="e.g. 90s cartoon, Humayun Ahmed..."
                              className="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-pink-500 text-white font-medium"
                            />
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[10px] text-gray-500">
                          <span>Clear seen lists:</span>
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.removeItem("recently_used_words");
                              alert("History cleared! ⚡");
                            }}
                            className="font-bold text-pink-400/80 hover:text-pink-400 underline cursor-pointer"
                          >
                            Reset AI History
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Launch Round Button */}
            <div className={`w-full ${maxWidthClass} shrink-0 z-10 pt-1.5 sm:pt-3.5 flex flex-col gap-1`}>
              <button
                onClick={handleStartGame}
                className={`${
                  isHorizontalLayout ? "h-11 text-base rounded-[16px]" : "h-15 text-lg rounded-[20px]"
                } relative w-full select-none flex items-center justify-center gap-3 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:opacity-95 text-white font-extrabold tracking-wide transform active:scale-97 cursor-pointer shadow-[0_5px_22px_rgba(139,92,246,0.35)] touch-manipulation`}
              >
                <div className="absolute inset-0 w-[50%] bg-white/15 -skew-x-[25deg] transform -translate-x-[250%] animate-shimmer" />
                <Play className="w-4 h-4 fill-current" />
                <span>START ROUND</span>
              </button>

              {/* Status Indicator */}
              {debugSourceInfo && (
                <div className="flex justify-center items-center p-0.5 font-mono text-[9px] text-gray-500 select-none text-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Active Deck:</span>
                  <span className={`font-black ${
                    debugSourceInfo.source === "gemini" 
                      ? "text-pink-500" 
                      : debugSourceInfo.source === "fallback_mixed"
                      ? "text-yellow-500"
                      : "text-cyan-400"
                  }`}>
                    {debugSourceInfo.source === "gemini" 
                      ? "AI Custom" 
                      : debugSourceInfo.source === "fallback_mixed"
                      ? "Mixed Backups"
                      : "Offline Regular"}
                  </span>
                </div>
              )}
            </div>

            {/* AI Generation Loader Backdrop */}
            {isLoadingAI && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fade-in text-center">
                <Loader className="w-12 h-12 text-pink-500 animate-spin mb-4" />
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400 animate-pulse">
                  মামা কার্ড সাজানো হচ্ছে!
                </h3>
                <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest font-mono">
                  Gemini is crafting customized party cards...
                </p>
                <div className="mt-5 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] text-gray-500 max-w-sm italic">
                  &ldquo; Card generation produces unique items for every team session. Please wait... &rdquo;
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
            onOpenLeaderboard={() => setScreen("leaderboard_view")}
            layoutMode={layoutMode}
            setLayoutMode={setLayoutMode}
            isPortrait={isPortrait}
          />
        );
    }
  };

  return (
    <div
      id="gallery-bondhus-container"
      className={`relative w-full bg-dark-party text-white transition-all overflow-hidden flex flex-col ${
        layoutMode === "horizontal" && isPortrait ? "manual-horizontal-shell" : ""
      }`}
      style={{
        height: "var(--app-height, 100dvh)",
        minHeight: "var(--app-height, 100dvh)"
      }}
    >
      {/* Interactive content based on screen state */}
      {renderInteractiveScreen()}
    </div>
  );
}
