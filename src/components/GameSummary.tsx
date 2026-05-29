/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { Trophy, ArrowLeft, RefreshCw, Star, Save, CheckCircle, XCircle } from "lucide-react";
import { CATEGORIES } from "../data";

interface GameSummaryProps {
  score: number;
  correctCount: number;
  skippedCount: number;
  answeredCards: { id: string; word: string; status: "correct" | "skipped"; category: string }[];
  onPlayAgain: () => void;
  onNewGame: () => void;
  onSaveScore: (name: string) => void;
  categoriesUsed: string[];
}

export default function GameSummary({
  score,
  correctCount,
  skippedCount,
  answeredCards,
  onPlayAgain,
  onNewGame,
  onSaveScore,
  categoriesUsed
}: GameSummaryProps) {
  const [playerName, setPlayerName] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const getFunnyVerdict = () => {
    if (score >= 25) return "উষ্ণ অভিনন্দন! আপনি হলেন সর্বকালের সেরা গেমার মামা! 👑🏆";
    if (score >= 15) return "অস্থির খেলেছেন! কড়া পিনিক তুললেন তো বন্ধুমহল! 🔥⚡";
    if (score >= 7) return "দারুণ খেলেছেন, প্যারা নাই চিল! আরেকটু হলে তো কোপাই দিতেন! 😎";
    return "আরেহ মামা! আরেকটু চেষ্টা করুন, নো চিন্তা ডু ফুর্তি! ☕";
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    onSaveScore(playerName.trim());
    setIsSaved(true);
  };

  // Compile category tallies
  const categoryTallies = categoriesUsed.reduce((acc, catId) => {
    const categoryInfo = CATEGORIES.find((c) => c.id === catId);
    const correctInCat = answeredCards.filter((c) => c.category === catId && c.status === "correct").length;
    acc.push({
      id: catId,
      name: categoryInfo?.nameEnglish || catId,
      count: correctInCat,
      textColor: categoryInfo?.textColor || "text-white"
    });
    return acc;
  }, [] as { id: string; name: string; count: number; textColor: string }[]);

  return (
    <div className="relative flex flex-col justify-between items-center w-full h-[100dvh] text-white bg-[#0b041a] overflow-hidden p-6 md:p-8 select-none font-sans">
      
      {/* Glow overlays/ambience in the background */}
      <div className="absolute inset-x-0 top-0 h-40 bg-pink-500/5 blur-[80px] pointer-events-none" />

      {/* 1. HEADER AND TITLE */}
      <div className="flex flex-col items-center shrink-0 text-center z-10">
        <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400 uppercase tracking-widest">
          Game Over
        </h2>
        <p className="text-xs text-gray-400/90 font-medium mt-1.5 max-w-[320px] leading-relaxed">
          {getFunnyVerdict()}
        </p>
      </div>

      {/* 2. BODY RESULTS PANEL: Glassy, simple, centered column container */}
      <div className="flex-1 w-full max-w-[420px] overflow-y-auto space-y-4 my-auto pr-1 z-10 scrollbar-thin py-2">
        
        {/* Simple Trophy & Large Score Card */}
        <div className="p-5 bg-[#12082b] border border-pink-500/10 rounded-[24px] flex flex-col items-center text-center relative overflow-hidden">
          <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.2)] animate-bounce shrink-0 mb-2" />
          
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">TOTAL SCORE</span>
          <div className="text-5xl font-black text-white leading-none font-sans mt-1">
            {score}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 w-full border-t border-white/5 pt-3 shrink-0 text-xs">
            <div>
              <span className="text-emerald-400 font-bold block text-sm">
                {correctCount}
              </span>
              <p className="text-gray-500 font-medium">Correct</p>
            </div>
            <div>
              <span className="text-pink-400 font-bold block text-sm">
                {skippedCount}
              </span>
              <p className="text-gray-500 font-medium">Skipped</p>
            </div>
          </div>
        </div>

        {/* Save Leaderboard Form */}
        <div className="p-5 bg-[#12082b] border border-cyan-400/10 rounded-[24px] flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold uppercase tracking-widest mb-3">
            <span>Record Score</span>
          </div>

          {isSaved ? (
            <div className="py-3 text-center bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <span className="text-xs font-bold text-emerald-400">Score Saved Successfully! ✅</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-2 shrink-0">
              <p className="text-[10px] text-gray-500 leading-normal">Enter your nick name to save current score in the leaderboard:</p>
              <div className="flex gap-2 mt-1.5 shrink-0">
                <input
                  type="text"
                  maxLength={15}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your Name..."
                  className="flex-1 min-w-0 px-3.5 py-2.5 text-xs bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none text-white font-medium"
                />
                <button
                  type="submit"
                  disabled={!playerName.trim()}
                  className="px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:scale-100 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </form>
          )}

          {/* Performance breakdown summary list */}
          {categoryTallies.length > 0 && (
            <div className="mt-4 text-left border-t border-white/5 pt-3">
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Hits by Category</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {categoryTallies.map((cat) => (
                  <div key={cat.id} className="bg-white/5 border border-white/5 p-2 px-3 rounded-xl flex justify-between items-center text-xs">
                    <span className="text-gray-300 truncate font-bold text-[10px] max-w-[80px]">{cat.name}</span>
                    <span className="bg-white/5 text-pink-400 px-2 py-0.5 rounded-lg text-[10px] font-bold">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trail History / Scrollable list of guessed cards */}
        <div className="p-5 bg-[#12082b] border border-white/5 rounded-[24px] flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold text-left mb-2 block">WORD TRAIL</span>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5 text-xs text-left scrollbar-thin">
            {answeredCards.length === 0 ? (
              <p className="text-gray-500 italic text-[10px] text-center py-4">No words answered.</p>
            ) : (
              answeredCards.map((c, i) => (
                <div
                  key={`${c.id}-${i}`}
                  className={`flex justify-between items-center p-2 rounded-xl border px-3 ${
                    c.status === "correct"
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      : "bg-pink-500/5 border-pink-500/20 text-pink-400"
                  }`}
                >
                  <span className="font-bold truncate pr-2">{c.word}</span>
                  <span className="text-[9px] font-bold uppercase bg-white/5 px-2 py-0.5 rounded-lg">
                    {c.status === "correct" ? "OK" : "SKIP"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 3. NAVIGATION CONTROLS AT THE BOTTOM */}
      <div className="w-full max-w-[420px] grid grid-cols-2 gap-3 shrink-0 z-10 pt-4">
        {/* Play Again button with gradient */}
        <button
          onClick={onPlayAgain}
          className="w-full h-13 select-none flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white font-extrabold text-sm rounded-2xl transform active:scale-97 cursor-pointer shadow-lg shadow-pink-500/10 touch-manipulation"
        >
          <RefreshCw className="w-4 h-4 animate-[spin_5s_linear_infinite]" />
          <span>PLAY AGAIN</span>
        </button>

        {/* New Game back button */}
        <button
          onClick={onNewGame}
          className="w-full h-13 select-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-extrabold text-sm rounded-2xl transform active:scale-97 cursor-pointer touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>NEW GAME</span>
        </button>
      </div>

    </div>
  );
}
