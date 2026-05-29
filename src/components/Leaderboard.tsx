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
    <div className="flex flex-col h-full text-white bg-[#12082b]/95 border border-white/5 rounded-3xl shadow-2xl overflow-hidden p-5 select-none relative">
      {/* Leaderboard Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="text-base font-black tracking-wider text-white font-sans uppercase">
            Leaderboard
          </h2>
        </div>

        {/* Clear Trigger */}
        {activeTab === "allTime" && allTimeScores.length > 0 && (
          <button
            onClick={clearLeaderboard}
            className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 transition-colors px-2.5 py-1 bg-white/5 rounded-xl border border-white/5 cursor-pointer"
            title="Clear all records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 bg-white/5 p-1 rounded-2xl mb-4 border border-white/5 shrink-0">
        <button
          onClick={() => setActiveTab("session")}
          className={`py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
            activeTab === "session"
              ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          This Session
        </button>
        <button
          onClick={() => setActiveTab("allTime")}
          className={`py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
            activeTab === "allTime"
              ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          All Time
        </button>
      </div>

      {/* Score List Panel */}
      <div className="flex-1 overflow-y-auto px-1 space-y-2 max-h-[160px] md:max-h-[220px] min-h-[0px] scrollbar-thin">
        {scoresToRender.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-center">
            <User className="w-7 h-7 opacity-20 mb-1.5" />
            <p className="text-xs font-bold">No Records Yet!</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Play a game to save the first record.</p>
          </div>
        ) : (
          scoresToRender.map((entry, idx) => {
            // High scoring styles
            const isTopRank = idx < 3;
            const rankStyles = [
              "bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20 text-yellow-400",
              "bg-gradient-to-r from-cyan-500/10 to-transparent border-cyan-500/20 text-cyan-400",
              "bg-gradient-to-r from-pink-500/10 to-transparent border-pink-500/20 text-pink-400"
            ];
            const rankIcons = [
              <Trophy className="w-3.5 h-3.5 text-yellow-500" key="rank1" />,
              <Medal className="w-3.5 h-3.5 text-cyan-400" key="rank2" />,
              <Medal className="w-3.5 h-3.5 text-pink-400" key="rank3" />
            ];

            return (
              <div
                key={entry.id}
                className={`flex justify-between items-center px-3.5 py-2 text-xs rounded-xl border border-white/5 bg-white/2 transition-all ${
                  isTopRank ? rankStyles[idx] : "text-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Position number or Cup */}
                  <span className="w-4 font-mono font-bold text-center flex items-center justify-center">
                    {isTopRank ? rankIcons[idx] : `#${idx + 1}`}
                  </span>
                  <div>
                    <p className="font-bold font-sans tracking-wide truncate max-w-[110px] sm:max-w-none">
                      {entry.name}
                    </p>
                    <p className="text-[9px] text-gray-500 flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {entry.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-right font-mono">
                  <span className="text-[10px] font-bold text-gray-500">Score:</span>
                  <span className="text-xs font-bold text-white bg-white/5 rounded-lg px-2 py-0.5 border border-white/5">
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
          className="mt-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 font-bold rounded-xl text-white transition-all text-xs text-center cursor-pointer shrink-0"
        >
          Back to Menu
        </button>
      )}
    </div>
  );
}
