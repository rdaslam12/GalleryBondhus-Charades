/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card } from "../data";

/**
 * Normalizes text to catch duplicates across Bangla, English, capitalization, and spaces.
 */
export function normalizeCardKey(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    // Remove space characters and common punctuation/symbols
    .replace(/[\s\p{P}\-_()[\]（）]/gu, "")
    // Normalize Bangla specific characters/punctuation
    .replace(/[।?!.,৳—–]/g, "");
}

/**
 * Deduplicates cards by detecting duplicates in word or transliteration keys
 */
export function dedupeCards(cards: Card[]): Card[] {
  const seenKeys = new Set<string>();
  const deduped: Card[] = [];

  for (const card of cards) {
    if (!card || !card.word) continue;
    const wordKey = normalizeCardKey(card.word);
    
    // Avoid exact duplicate keys or duplicate transliterations
    if (!seenKeys.has(wordKey)) {
      seenKeys.add(wordKey);
      
      const translitKey = card.englishTranslit ? normalizeCardKey(card.englishTranslit) : "";
      if (translitKey && translitKey.length > 3) {
        seenKeys.add(translitKey);
      }
      
      deduped.push(card);
    }
  }
  return deduped;
}

/**
 * Filters out cards that match recently used keys.
 */
export function removeRecentlyUsed(cards: Card[], recentKeys: string[]): Card[] {
  if (!recentKeys || recentKeys.length === 0) return cards;
  const recentSet = new Set(recentKeys.map(k => normalizeCardKey(k)));
  return cards.filter(card => {
    const wordKey = normalizeCardKey(card.word);
    const translitKey = card.englishTranslit ? normalizeCardKey(card.englishTranslit) : "";
    return !recentSet.has(wordKey) && (translitKey ? !recentSet.has(translitKey) : true);
  });
}

const RECENT_CARDS_KEY = "gallery_bondhus_recent_cards";

/**
 * Loads recently used card keys from localStorage
 */
export function getRecentlyUsedKeys(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_CARDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Saves words generated/used in this session to the running localStorage log (limits to 400 entries)
 */
export function saveRecentlyUsed(cards: Card[]) {
  try {
    const recent = getRecentlyUsedKeys();
    const newKeys = cards.map(c => normalizeCardKey(c.word));
    // Combine keys and truncate to keep unique history of last 400 entries
    const combined = Array.from(new Set([...newKeys, ...recent])).slice(0, 400);
    localStorage.setItem(RECENT_CARDS_KEY, JSON.stringify(combined));
  } catch (e) {
    console.error("Local storage error in saveRecentlyUsed:", e);
  }
}

/**
 * Fisher-Yates shuffle helper
 */
export function shuffleCards<T>(arr: T[]): T[] {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}
