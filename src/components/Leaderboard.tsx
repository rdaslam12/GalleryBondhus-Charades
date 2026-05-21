/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Trophy, Clock, Medal, User, Trash2 } from "lucide-react";

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  date: string;
  categories: string[];
  isSession?: boolean;
}

interface LeaderboardProps {
  onBack?: () => void;
  currentSessionScores: LeaderboardEntry[];
  visible: boolean;
}

export default function Leaderboard({ onBack, currentSessionScores, visible }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<"session" | "allTime">("session");
  const [allTimeScores, setAllTimeScores] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // Load scores from localStorage
    try {
      const stored = localStorage.getItem("gallery_bondhus_leaderboard");
      if (stored) {
        setAllTimeScores(JSON.parse(stored));
      } else {
        // Mock default leaderboard data for an authentic filled look
        const defaultScores: LeaderboardEntry[] = [
          { id: "m-1", name: "Bondhu Sadiq", score: 32, date: "2026-05-21", categories: ["celebrities_creators"] },
          { id: "m-2", name: "Kabila Vai", score: 28, date: "2026-05-21", categories: ["movies_series", "dhaka_memes_slang"] },
          { id: "m-3", name: "Ayan", score: 24, date: "2026-05-20", categories: ["food_culture"] },
          { id: "m-4", name: "Mehaz", score: 18, date: "2026-05-19", categories: ["celebrities_creators"] },
          { id: "m-5", name: "Chanchal Chow", score: 16, date: "2026-05-18", categories: ["movies_series"] }
        ];
        localStorage.setItem("gallery_bondhus_leaderboard", JSON.stringify(defaultScores));
        setAllTimeScores(defaultScores);
      }
    } catch (e) {
      console.error("Could not load leaderboard from localStorage:", e);
    }
  }, [currentSessionScores, visible]);

  // Merge & Sort session scores vs all time scores
  const getLeaderboardList = () => {
    if (activeTab === "session") {
      // Return compiled session scores sorted by descending order
      return [...currentSessionScores].sort((a, b) => b.score - a.score);
    } else {
      // Return all time score database
      return [...allTimeScores].sort((a, b) => b.score - a.score);
    }
  };

  const clearLeaderboard = () => {
    if (window.confirm("আপনি কি সব রেকর্ড মুছে দিতে চান? (Clear Leaderboard?)")) {
      try {
        localStorage.removeItem("gallery_bondhus_leaderboard");
        setAllTimeScores([]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const scoresToRender = getLeaderboardList();

  return (
    <div className="flex flex-col h-full text-white bg-card-dark/95 border-2 border-neon-purple/50 rounded-2xl glow-border-purple overflow-hidden p-4 select-none relative">
      {/* Leaderboard Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-neon-yellow animate-bounce-gentle" />
          <h2 className="text-lg font-bold tracking-tight text-white font-sans uppercase">
            Leaderboard <span className="text-xs text-neon-blue font-mono font-normal tracking-normal lowercase">(local records)</span>
          </h2>
        </div>

        {/* Clear Trigger */}
        {activeTab === "allTime" && allTimeScores.length > 0 && (
          <button
            onClick={clearLeaderboard}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-neon-pink transition-colors px-2 py-1 bg-gray-900/40 rounded-lg hover:bg-gray-900 cursor-pointer"
            title="Clear all records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>মুছে ফেলুন</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 bg-gray-950/70 p-1 rounded-xl mb-4 border border-gray-800/40 shrink-0">
        <button
          onClick={() => setActiveTab("session")}
          className={`py-2 text-xs font-bold rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer ${
            activeTab === "session"
              ? "bg-neon-purple text-white shadow-md shadow-neon-purple/30"
              : "text-gray-400 hover:text-white"
          }`}
        >
          This Session (এই সেশনে)
        </button>
        <button
          onClick={() => setActiveTab("allTime")}
          className={`py-2 text-xs font-bold rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer ${
            activeTab === "allTime"
              ? "bg-neon-purple text-white shadow-md shadow-neon-purple/30"
              : "text-gray-400 hover:text-white"
          }`}
        >
          All Time (সব সময়ের সেরা)
        </button>
      </div>

      {/* Score List Panel */}
      <div className="flex-1 overflow-y-auto px-1 space-y-2 max-h-[140px] md:max-h-[180px] min-h-[0px]">
        {scoresToRender.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-gray-500 text-center">
            <User className="w-8 h-8 opacity-20 mb-1" />
            <p className="text-xs font-medium">কোন রেকর্ড নেই!</p>
            <p className="text-[10px] opacity-60 mt-0.5">এখনই গেম খেলে প্রথম রেকর্ড করুন।</p>
          </div>
        ) : (
          scoresToRender.map((entry, idx) => {
            // High scoring styles
            const isTopRank = idx < 3;
            const rankStyles = [
              "bg-gradient-to-r from-neon-yellow/10 to-transparent border-neon-yellow/30 text-neon-yellow",
              "bg-gradient-to-r from-neon-blue/10 to-transparent border-neon-blue/30 text-neon-blue",
              "bg-gradient-to-r from-neon-pink/10 to-transparent border-neon-pink/30 text-neon-pink"
            ];
            const rankIcons = [
              <Trophy className="w-4 h-4 text-neon-yellow" key="rank1" />,
              <Medal className="w-4 h-4 text-neon-blue" key="rank2" />,
              <Medal className="w-4 h-4 text-neon-pink" key="rank3" />
            ];

            return (
              <div
                key={entry.id}
                className={`flex justify-between items-center px-4 py-2 text-xs rounded-xl border border-gray-800/40 bg-gray-950/40 transition-all ${
                  isTopRank ? rankStyles[idx] : "text-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Position number or Cup */}
                  <span className="w-5 font-mono font-bold text-center">
                    {isTopRank ? rankIcons[idx] : `#${idx + 1}`}
                  </span>
                  <div>
                    <p className="font-bold font-sans tracking-wide truncate max-w-[120px] sm:max-w-none">
                      {entry.name}
                    </p>
                    <p className="text-[9px] text-gray-500 flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {entry.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-right font-mono">
                  <span className="text-xs font-semibold text-gray-500">Score:</span>
                  <span className="text-sm font-extrabold text-white bg-gray-900/60 rounded px-1.5 py-0.5 border border-gray-800">
                    {entry.score}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="mt-3 py-2 bg-gray-900 hover:bg-gray-800 border-2 border-neon-blue/40 font-bold rounded-xl text-neon-blue hover:text-white transition-all text-xs text-center cursor-pointer cursor-point shrink-0"
        >
          মেন্যুতে ফিরুন (Back)
        </button>
      )}
    </div>
  );
}
