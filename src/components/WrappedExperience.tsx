"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Music, Loader2, Trophy } from "lucide-react";

/* eslint-disable @next/next/no-img-element */

interface WrappedExperienceProps {
  label: string;
  playlistId: string;
  type: "playlist" | "current_year";
  onClose: () => void;
}

interface WrappedData {
  source: "playlist" | "current_year";
  totalMinutes?: number;
  totalTracks: number;
  totalArtists: number;
  topGenres?: string[];
  topTrack: { name: string; artist: string; albumImage?: string; duration_ms: number } | null;
  top5Tracks: { name: string; artist: string; albumImage?: string; duration_ms: number }[];
  top5Artists: { name: string; trackCount: number; image?: string; genres?: string[] }[];
}

const AUTO_ADVANCE_SECONDS = 8;

const cardGradients = [
  "from-purple-900 via-indigo-900 to-black",
  "from-green-900 via-emerald-900 to-black",
  "from-orange-900 via-red-900 to-black",
  "from-pink-900 via-rose-900 to-black",
  "from-violet-900 via-purple-900 to-black",
  "from-amber-900 via-yellow-900 to-black",
];

// Cards are dynamic based on data source - built in the component

function IntroCard({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="mb-8"
      >
        <div className="w-32 h-32 rounded-full bg-[#1DB954]/20 flex items-center justify-center mx-auto mb-6">
          <Music className="w-16 h-16 text-[#1DB954]" />
        </div>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="text-4xl md:text-6xl font-black mb-4"
      >
        Your <span className="text-[#1DB954]">{label}</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-xl text-[#b3b3b3]"
      >
        Let&apos;s see what you listened to
      </motion.p>
    </div>
  );
}

function StatsCard({ data }: { data: WrappedData }) {
  const hasMinutes = typeof data.totalMinutes === "number" && data.totalMinutes > 0;
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 12, delay: 0.3 }}
      >
        {hasMinutes ? (
          <>
              <p className="text-lg text-[#b3b3b3] mb-2">Your top songs added up to</p>
              <h1 className="text-6xl md:text-8xl font-black text-[#1DB954] mb-2">
                {data.totalMinutes?.toLocaleString()}
              </h1>
            <p className="text-2xl font-bold mb-8">minutes of music</p>
          </>
        ) : (
          <>
            <p className="text-lg text-[#b3b3b3] mb-2">Your taste spanned across</p>
            <h1 className="text-6xl md:text-8xl font-black text-[#1DB954] mb-2">
              {data.totalTracks}
            </h1>
            <p className="text-2xl font-bold mb-8">top tracks</p>
          </>
        )}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="flex gap-8"
      >
        {hasMinutes && (
          <div className="text-center">
            <p className="text-3xl font-black">{data.totalTracks.toLocaleString()}</p>
            <p className="text-sm text-[#b3b3b3]">top songs</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-3xl font-black">{data.totalArtists}</p>
          <p className="text-sm text-[#b3b3b3]">artists</p>
        </div>
        {data.topGenres && data.topGenres.length > 0 && (
          <div className="text-center">
            <p className="text-3xl font-black">{data.topGenres.length}+</p>
            <p className="text-sm text-[#b3b3b3]">genres</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function GenresCard({ data }: { data: WrappedData }) {
  const genres = data.topGenres || [];
  const layerColors = ["bg-[#1DB954]", "bg-purple-500", "bg-pink-500", "bg-amber-500", "bg-cyan-500"];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-black mb-2"
      >
        Your Sound
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-[#b3b3b3] mb-8"
      >
        The genres that defined you
      </motion.p>
      <div className="space-y-3 w-full max-w-xs">
        {genres.map((genre, i) => (
          <motion.div
            key={genre}
            initial={{ opacity: 0, x: i % 2 === 0 ? -100 : 100, rotateZ: i % 2 === 0 ? -5 : 5 }}
            animate={{ opacity: 1, x: 0, rotateZ: 0 }}
            transition={{ delay: 0.5 + i * 0.15, type: "spring", stiffness: 120, damping: 12 }}
            className={`${layerColors[i % layerColors.length]} rounded-xl py-3 px-6 text-black font-bold text-lg shadow-lg capitalize`}
          >
            {genre}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TopArtistsCard({ data }: { data: WrappedData }) {
  const medals = ["🥇", "🥈", "🥉", "4", "5"];
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-black mb-2"
      >
        Your Top Artists
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-[#b3b3b3] mb-8"
      >
        The artists who defined your year
      </motion.p>
      <div className="w-full max-w-sm space-y-3">
        {data.top5Artists.map((artist, i) => (
          <motion.div
            key={artist.name}
            initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.12, type: "spring", stiffness: 120, damping: 14 }}
            className="flex items-center gap-4 bg-white/5 rounded-xl p-3 backdrop-blur-sm"
          >
            <span className="text-2xl w-8 text-center">{medals[i]}</span>
            {artist.image ? (
              <img src={artist.image} alt={artist.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#282828] flex items-center justify-center font-bold text-lg">
                {artist.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 text-left min-w-0">
              <p className={`font-bold truncate ${i === 0 ? "text-[#1DB954]" : ""}`}>{artist.name}</p>
              {artist.trackCount > 0 && (
                <p className="text-xs text-[#b3b3b3]">{artist.trackCount} tracks in your top</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TopTracksCard({ data }: { data: WrappedData }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-black mb-2"
      >
        Your Top Tracks
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-[#b3b3b3] mb-8"
      >
        The songs you had on repeat
      </motion.p>
      <div className="w-full max-w-sm space-y-2">
        {data.top5Tracks.map((track, i) => (
          <motion.div
            key={track.name + i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 120, damping: 14 }}
            className="flex items-center gap-3 bg-white/5 rounded-xl p-3 backdrop-blur-sm"
          >
            <span className="text-[#b3b3b3] font-mono text-sm w-6 text-right">{i + 1}</span>
            {track.albumImage ? (
              <img src={track.albumImage} alt={track.name} className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded bg-[#282828] flex items-center justify-center">
                <Music className="w-5 h-5 text-[#b3b3b3]" />
              </div>
            )}
            <div className="flex-1 text-left min-w-0">
              <p className={`font-semibold text-sm truncate ${i === 0 ? "text-[#1DB954]" : ""}`}>{track.name}</p>
              <p className="text-xs text-[#b3b3b3] truncate">{track.artist}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TopTrackCard({ data }: { data: WrappedData }) {
  const track = data.topTrack;
  if (!track) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-black mb-8"
      >
        Your #1 Track
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 100, damping: 12 }}
        className="w-48 h-48 rounded-2xl overflow-hidden mb-6 shadow-2xl border border-white/10"
      >
        {track.albumImage ? (
          <img src={track.albumImage} alt={track.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1DB954]/30 to-purple-600/30 flex items-center justify-center">
            <Music className="w-20 h-20 text-[#1DB954]" />
          </div>
        )}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3 className="text-2xl font-black mb-1">{track.name}</h3>
        <p className="text-[#b3b3b3] mb-4">{track.artist}</p>
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-5 py-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold">Your most played song</span>
        </div>
      </motion.div>
    </div>
  );
}

function OutroCard({ label, onClose }: { label: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="text-8xl mb-8"
      >
        🎉
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="text-4xl md:text-5xl font-black mb-4"
      >
        That was your <span className="text-[#1DB954]">{label}</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-lg text-[#b3b3b3] mb-8 max-w-md"
      >
        Thanks for listening. Here&apos;s to another year of great music!
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        onClick={onClose}
        className="px-8 py-3 rounded-full bg-[#1DB954] text-black font-bold hover:bg-[#1ed760] transition-all hover:scale-105 active:scale-95"
      >
        Back to Dashboard
      </motion.button>
    </div>
  );
}

function buildCardList(data: WrappedData): string[] {
  const cards = ["intro", "stats"];
  if (data.topGenres && data.topGenres.length > 0) {
    cards.push("genres");
  }
  cards.push("top-artists", "top-tracks", "top-track", "outro");
  return cards;
}

export default function WrappedExperience({ label, playlistId, type: _type, onClose }: WrappedExperienceProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [data, setData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const progressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, forceRender] = useState(0);

  const cardIds = data ? buildCardList(data) : [];
  const totalCards = cardIds.length;

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/spotify/wrapped-data?playlist_id=${playlistId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch wrapped data:", err);
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Smooth progress bar using requestAnimationFrame
  useEffect(() => {
    if (loading || !data || totalCards === 0) return;

    progressRef.current = 0;
    let startTime = performance.now();
    const duration = AUTO_ADVANCE_SECONDS * 1000;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      progressRef.current = Math.min((elapsed / duration) * 100, 100);
      forceRender(n => n + 1);
      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    // Auto-advance
    timerRef.current = setTimeout(() => {
      setCurrentCard(prev => (prev < totalCards - 1 ? prev + 1 : prev));
    }, duration);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentCard, loading, data, totalCards]);

  const clearTimers = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const goNext = () => {
    clearTimers();
    if (currentCard < totalCards - 1) setCurrentCard(currentCard + 1);
  };

  const goPrev = () => {
    clearTimers();
    if (currentCard > 0) setCurrentCard(currentCard - 1);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#1DB954] animate-spin" />
          <p className="text-[#b3b3b3]">Loading your {label} Wrapped...</p>
        </div>
      </motion.div>
    );
  }

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-[#b3b3b3] mb-4">Failed to load your Wrapped data</p>
          <button onClick={onClose} className="px-6 py-3 rounded-full bg-[#1DB954] text-black font-bold">
            Go Back
          </button>
        </div>
      </motion.div>
    );
  }

  const renderCard = () => {
    switch (cardIds[currentCard]) {
      case "intro": return <IntroCard label={label} />;
      case "stats": return <StatsCard data={data} />;
      case "genres": return <GenresCard data={data} />;
      case "top-artists": return <TopArtistsCard data={data} />;
      case "top-tracks": return <TopTracksCard data={data} />;
      case "top-track": return <TopTrackCard data={data} />;
      case "outro": return <OutroCard label={label} onClose={onClose} />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Progress Bar - smooth via requestAnimationFrame */}
      <div className="absolute top-0 left-0 right-0 z-40 flex gap-1 p-3">
        {cardIds.map((_id, i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
            {i < currentCard ? (
              <div className="h-full bg-white rounded-full w-full" />
            ) : i === currentCard ? (
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${progressRef.current}%`, transition: "none" }}
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* Card Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCard}
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -80 }}
          transition={{ duration: 0.4, ease: "easeInOut" as const }}
          className={`h-full bg-gradient-to-b ${cardGradients[currentCard % cardGradients.length]} flex items-center justify-center`}
        >
          {renderCard()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-40 flex items-center justify-between p-6">
        <button
          onClick={goPrev}
          disabled={currentCard === 0}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-sm text-[#b3b3b3]">
          {currentCard + 1} / {totalCards}
        </div>

        {currentCard < totalCards - 1 ? (
          <button
            onClick={goNext}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-full bg-[#1DB954] text-black font-bold text-sm hover:bg-[#1ed760] transition-colors"
          >
            Done!
          </button>
        )}
      </div>
    </motion.div>
  );
}
