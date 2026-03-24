"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Sparkles, Loader2, Clock, ListMusic, Search } from "lucide-react";

/* eslint-disable @next/next/no-img-element */

interface WrappedOption {
  playlistId: string;
  trackCount: number;
  image?: string;
  label: string;
  subtitle: string;
  type: "playlist" | "timerange";
}

interface YearSelectorProps {
  onSelect: (label: string, playlistId: string, type: "playlist" | "timerange") => void;
  onClose: () => void;
}

export default function YearSelector({ onSelect, onClose }: YearSelectorProps) {
  const [timeRangeOptions, setTimeRangeOptions] = useState<WrappedOption[]>([]);
  const [playlistOptions, setPlaylistOptions] = useState<WrappedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/spotify/wrapped-years");
      if (res.ok) {
        const data = await res.json();
        setTimeRangeOptions(data.timeRangeOptions || []);
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

  const timeRangeGradients: Record<string, string> = {
    short_term: "from-rose-600 to-pink-800",
    medium_term: "from-purple-600 to-indigo-800",
    long_term: "from-amber-600 to-orange-800",
  };

  const timeRangeIcons: Record<string, string> = {
    short_term: "4w",
    medium_term: "6m",
    long_term: "∞",
  };

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
            {/* Time Range section */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-[#b3b3b3]" />
                <p className="text-sm font-semibold text-[#b3b3b3] uppercase tracking-wider">By Time Period</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {timeRangeOptions.map((option, i) => (
                  <motion.button
                    key={option.playlistId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => onSelect(option.label, option.playlistId, option.type)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#282828] hover:bg-[#333333] transition-all hover:scale-[1.03] active:scale-[0.97] group"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${timeRangeGradients[option.playlistId]} flex items-center justify-center`}>
                      <span className="text-white font-black text-xs">
                        {timeRangeIcons[option.playlistId]}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold group-hover:text-[#1DB954] transition-colors">{option.label}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Playlists section */}
            <div className="flex flex-col overflow-hidden min-h-0">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <ListMusic className="w-4 h-4 text-[#b3b3b3]" />
                <p className="text-sm font-semibold text-[#b3b3b3] uppercase tracking-wider">
                  From Playlist ({playlistOptions.length})
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
