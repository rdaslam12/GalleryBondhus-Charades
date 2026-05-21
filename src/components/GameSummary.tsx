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
    <div className="relative flex flex-col justify-between items-center w-full h-full text-white bg-dark-party overflow-hidden p-4 select-none font-sans">
      
      {/* 1. HEADER AND TITLE */}
      <div className="flex flex-col items-center shrink-0">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-yellow to-neon-pink glow-text-pink leading-none">
          Game Over!
        </h2>
        <p className="text-xs text-neon-yellow font-medium mt-1 tracking-wide font-sans">
          {getFunnyVerdict()}
        </p>
      </div>

      {/* 2. BODY RESULTS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 w-full max-w-[660px] md:max-w-[760px] items-stretch my-auto min-h-[0px] flex-1 py-1">
        
        {/* Left Triumphant Card (Score Display) */}
        <div className="md:col-span-4 p-3 bg-gray-950/75 border border-purple-500/20 rounded-2xl flex flex-col justify-center items-center text-center relative overflow-hidden">
          {/* Subtle spinning star behind trophy */}
          <div className="absolute w-24 h-24 rounded-full bg-neon-yellow/10 blur-xl animate-pulse" />
          
          <Trophy className="w-12 h-12 text-neon-yellow drop-shadow-[0_0_15px_rgba(255,240,31,0.5)] animate-bounce-gentle shrink-0 z-10" />
          
          <div className="z-10 mt-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono block">মোট স্কোর / Score</span>
            <div className="text-4xl font-black text-white leading-none font-mono drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]">
              {score}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3 w-full border-t border-gray-900 pt-2 shrink-0 text-[10px]">
            <div>
              <span className="text-neon-green font-bold flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> {correctCount}
              </span>
              <p className="text-gray-500 font-medium">সঠিক (Correct)</p>
            </div>
            <div>
              <span className="text-neon-pink font-bold flex items-center justify-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> {skippedCount}
              </span>
              <p className="text-gray-500 font-medium">বাদ (Skipped)</p>
            </div>
          </div>
        </div>

        {/* Center: Save Leaderboard Dashboard */}
        <div className="md:col-span-5 p-3 bg-gray-950/75 border border-blue-500/20 rounded-2xl flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-xs text-neon-blue font-bold uppercase tracking-wide mb-2">
            <Star className="w-4 h-4 text-neon-blue" /> লিডারবোর্ড যুক্ত করুন / Record Score
          </div>

          {isSaved ? (
            <div className="py-4 text-center bg-gray-900/50 border border-neon-green/30 rounded-xl">
              <span className="text-xs font-bold text-neon-green">পয়েন্ট সফলভাবে সংরক্ষণ করা হয়েছে! ✅</span>
              <p className="text-[10px] text-gray-500 mt-1">আপনার বন্ধুরা এই স্কোর লিডারবোর্ডে দেখতে পারবে।</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-2 shrink-0">
              <p className="text-[10px] text-gray-400 leading-tight">আপনার নাম লিখে সাবমিট করুন যাতে স্থানীয় আড্ডার তালিকায় যুক্ত হওয়া যায়:</p>
              <div className="flex gap-1.5 mt-1 shrink-0">
                <input
                  type="text"
                  maxLength={15}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="আপনার ডাক নাম... (যেমন: কাবিলা)"
                  className="flex-1 px-3 py-2 text-xs bg-gray-900 border border-gray-800 rounded-xl focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue text-white"
                />
                <button
                  type="submit"
                  disabled={!playerName.trim()}
                  className="px-3 bg-neon-blue hover:bg-neon-purple active:scale-95 disabled:opacity-40 disabled:scale-100 text-dark-party rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>সংরক্ষণ</span>
                </button>
              </div>
            </form>
          )}

          {/* Performance breakdown summary */}
          <div className="mt-3 text-left">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-mono block">Category Wise Hit Rates</span>
            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              {categoryTallies.map((cat) => (
                <div key={cat.id} className="bg-gray-900/40 border border-gray-900 p-1.5 px-2 rounded-lg flex justify-between items-center text-[10px]">
                  <span className={`${cat.textColor} truncate font-bold text-[9px] max-w-[80px]`}>{cat.name}</span>
                  <span className="font-mono bg-dark-party text-white border border-gray-800 px-1.5 py-0.2 rounded font-bold">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Scrollable Card History */}
        <div className="md:col-span-3 p-3 bg-gray-950/75 border border-gray-800/60 rounded-2xl flex flex-col h-full max-h-[140px] md:max-h-none">
          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono text-left mb-1 shrink-0 block">গেমপ্লে কার্ডের ট্রেইল / Trail</span>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 text-[10px] text-left">
            {answeredCards.length === 0 ? (
              <p className="text-gray-500 italic text-[10px] text-center mt-6">কোন শব্দ অনুমিত হয়নি।</p>
            ) : (
              answeredCards.map((c, i) => (
                <div
                  key={`${c.id}-${i}`}
                  className={`flex justify-between items-center p-1 rounded-lg border px-1.5 ${
                    c.status === "correct"
                      ? "bg-neon-green/5 border-neon-green/20 text-neon-green/90"
                      : "bg-neon-pink/5 border-neon-pink/20 text-neon-pink/90"
                  }`}
                >
                  <span className="font-bold font-sans truncate pr-2">{c.word}</span>
                  <span className="text-[8px] font-mono uppercase bg-black/40 px-1 py-0.2 rounded">
                    {c.status === "correct" ? "OK" : "SKIP"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION CONTROLS AT THE BOTTOM */}
      <div className="grid grid-cols-2 gap-3 mt-2 w-full max-w-[400px] shrink-0 pointer-events-auto">
        <button
          onClick={onPlayAgain}
          className="flex items-center justify-center gap-2 px-6 py-4.5 bg-gradient-to-r from-neon-purple to-neon-pink hover:scale-103 active:scale-97 text-white font-black rounded-xl text-xs tracking-wider transition-all duration-300 transform cursor-pointer border border-neon-pink/20"
        >
          <RefreshCw className="w-4 h-4 animate-[spin_5s_linear_infinite]" />
          <span>প্লে এগেইন (Play Again)</span>
        </button>

        <button
          onClick={onNewGame}
          className="flex items-center justify-center gap-2 px-6 py-4.5 bg-gray-900 hover:bg-gray-800 hover:scale-103 active:scale-97 text-white border-2 border-neon-blue/40 font-black rounded-xl text-xs tracking-wider transition-all duration-300 transform cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>নতুন খেলা (New Game)</span>
        </button>
      </div>
    </div>
  );
}
