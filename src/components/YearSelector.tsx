"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Sparkles, Loader2, CalendarRange, ListMusic, Search } from "lucide-react";

/* eslint-disable @next/next/no-img-element */

interface WrappedOption {
  playlistId: string;
  trackCount: number;
  image?: string;
  label: string;
  subtitle: string;
  type: "playlist" | "current_year";
}

interface YearSelectorProps {
  onSelect: (label: string, playlistId: string, type: "playlist" | "current_year") => void;
  onClose: () => void;
}

export default function YearSelector({ onSelect, onClose }: YearSelectorProps) {
  const [currentYearOption, setCurrentYearOption] = useState<WrappedOption | null>(null);
  const [yearOptions, setYearOptions] = useState<WrappedOption[]>([]);
  const [playlistOptions, setPlaylistOptions] = useState<WrappedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/spotify/wrapped-years");
      if (res.ok) {
        const data = await res.json();
        setCurrentYearOption(data.currentYearOption || null);
        setYearOptions(data.yearOptions || []);
        setPlaylistOptions(data.playlistOptions || []);
      }
    } catch (err) {
      console.error("Failed to fetch wrapped options:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const filteredPlaylists = useMemo(() => {
    if (!search.trim()) return playlistOptions;
    const q = search.toLowerCase();
    return playlistOptions.filter(p =>
      p.label.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)
    );
  }, [playlistOptions, search]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-[#181818] rounded-2xl p-6 md:p-8 max-w-lg w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#1DB954]" />
            <h2 className="text-2xl font-black">Choose Your Wrapped</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#1DB954] animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 overflow-hidden">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <CalendarRange className="w-4 h-4 text-[#b3b3b3]" />
                <p className="text-sm font-semibold text-[#b3b3b3] uppercase tracking-wider">Current Year</p>
              </div>

              {currentYearOption && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onSelect(currentYearOption.label, currentYearOption.playlistId, currentYearOption.type)}
                  className="w-full rounded-2xl bg-gradient-to-br from-[#1DB954] via-emerald-500 to-lime-400 text-black p-4 text-left hover:scale-[1.01] active:scale-[0.99] transition-transform"
                >
                  <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Year to Date</p>
                  <p className="text-2xl font-black mt-2">{currentYearOption.label}</p>
                  <p className="text-sm mt-1 opacity-80">{currentYearOption.subtitle}</p>
                </motion.button>
              )}
            </div>

            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#b3b3b3]" />
                <p className="text-sm font-semibold text-[#b3b3b3] uppercase tracking-wider">
                  Previous Wrappeds ({yearOptions.length})
                </p>
              </div>

              {yearOptions.length === 0 ? (
                <p className="text-sm text-[#666] rounded-xl bg-[#202020] px-4 py-3">
                  No Spotify yearly playlists found yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {yearOptions.map((option, i) => (
                    <motion.button
                      key={option.playlistId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => onSelect(option.label, option.playlistId, option.type)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#202020] hover:bg-[#282828] transition-colors text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#282828] flex-shrink-0">
                        {option.image ? (
                          <img src={option.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-sm text-[#1DB954]">
                            {option.label.slice(0, 4)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate group-hover:text-[#1DB954] transition-colors">{option.label}</p>
                        <p className="text-xs text-[#666] truncate">{option.subtitle}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col overflow-hidden min-h-0">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <ListMusic className="w-4 h-4 text-[#b3b3b3]" />
                <p className="text-sm font-semibold text-[#b3b3b3] uppercase tracking-wider">
                  Custom Playlists ({playlistOptions.length})
                </p>
              </div>

              {/* Search */}
              <div className="relative mb-3 flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b3b3b3]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search playlists..."
                  className="w-full bg-[#282828] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#666] outline-none focus:ring-1 focus:ring-[#1DB954] transition-all"
                />
              </div>

              {/* Scrollable playlist list */}
              <div className="overflow-y-auto space-y-1 min-h-0 pr-1">
                {filteredPlaylists.length === 0 ? (
                  <p className="text-sm text-[#666] text-center py-6">No playlists match your search</p>
                ) : (
                  filteredPlaylists.map((option) => (
                    <button
                      key={option.playlistId}
                      onClick={() => onSelect(option.label, option.playlistId, option.type)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#282828] transition-colors group text-left"
                    >
                      <div className="w-10 h-10 rounded bg-[#282828] flex-shrink-0 overflow-hidden">
                        {option.image ? (
                          <img src={option.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ListMusic className="w-5 h-5 text-[#666]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-[#1DB954] transition-colors">
                          {option.label}
                        </p>
                        <p className="text-xs text-[#666] truncate">{option.subtitle}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
