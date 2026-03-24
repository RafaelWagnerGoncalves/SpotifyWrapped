"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Music, Mic2, Clock, ListMusic, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type DashboardTab = "profile" | "artists" | "tracks" | "recent" | "playlists";
type TimeRange = "short_term" | "medium_term" | "long_term";

interface DashboardProps {
  activeTab: DashboardTab;
}

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "short_term", label: "Last 4 Weeks" },
  { value: "medium_term", label: "Last 6 Months" },
  { value: "long_term", label: "All Time" },
];

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: "easeOut" as const },
  }),
};

/* eslint-disable @next/next/no-img-element */

function TimeRangeSelector({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
  return (
    <div className="flex gap-1 bg-[#181818] rounded-full p-1">
      {TIME_RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            value === opt.value
              ? "bg-[#1DB954] text-black"
              : "text-[#b3b3b3] hover:text-white"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SpotifyImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  if (src) {
    return <img src={src} alt={alt} className={className} />;
  }
  const colors = ["bg-red-600", "bg-blue-600", "bg-green-600", "bg-purple-600", "bg-pink-600", "bg-yellow-600"];
  const colorIdx = alt.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return (
    <div className={`${className} ${colors[colorIdx]} flex items-center justify-center font-bold text-white`}>
      {alt.charAt(0).toUpperCase()}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-[#1DB954] animate-spin" />
    </div>
  );
}

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(`Failed to fetch ${url}:`, err);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading };
}

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ProfileTab() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const { data: artistsData, loading: artistsLoading } = useFetch<{ items: SpotifyArtist[] }>(`/api/spotify/top-artists?limit=5&time_range=${timeRange}`);
  const { data: tracksData, loading: tracksLoading } = useFetch<{ items: SpotifyTrack[] }>(`/api/spotify/top-tracks?limit=5&time_range=${timeRange}`);

  const avatar = user?.images?.[0]?.url;

  return (
    <div>
      <motion.div
        className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-40 h-40 rounded-full bg-[#181818] flex items-center justify-center overflow-hidden">
          {avatar ? (
            <img src={avatar} alt={user?.display_name || ""} className="w-full h-full object-cover" />
          ) : (
            <User className="w-20 h-20 text-[#b3b3b3]" />
          )}
        </div>
        <div className="text-center md:text-left">
          <p className="text-xs uppercase tracking-widest text-[#b3b3b3] mb-1">Profile</p>
          <h1 className="text-4xl md:text-6xl font-black mb-4">{user?.display_name}</h1>
          <div className="flex gap-6 text-sm text-[#b3b3b3]">
            <span><strong className="text-white">{user?.followers?.total || 0}</strong> Followers</span>
            <span><strong className="text-white">{user?.product || "free"}</strong> Plan</span>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#b3b3b3]">Your Top Picks</h2>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Mic2 className="w-5 h-5 text-[#1DB954]" /> Top Artists
            </h2>
          </div>
          <AnimatePresence mode="wait">
            {artistsLoading ? <LoadingSpinner /> : (
              <motion.div key={timeRange + "-artists"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                {artistsData?.items?.map((artist, i) => (
                  <motion.div
                    key={artist.id}
                    custom={i}
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#181818] transition-colors group cursor-pointer"
                  >
                    <span className="text-[#b3b3b3] text-sm w-5 text-right">{i + 1}</span>
                    <SpotifyImage src={artist.images?.[2]?.url || artist.images?.[0]?.url} alt={artist.name} className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-[#1DB954] transition-colors">{artist.name}</p>
                      <p className="text-xs text-[#b3b3b3] truncate">{artist.genres?.slice(0, 2).join(", ")}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Music className="w-5 h-5 text-[#1DB954]" /> Top Tracks
            </h2>
          </div>
          <AnimatePresence mode="wait">
            {tracksLoading ? <LoadingSpinner /> : (
              <motion.div key={timeRange + "-tracks"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                {tracksData?.items?.map((track, i) => (
                  <motion.div
                    key={track.id}
                    custom={i}
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#181818] transition-colors group cursor-pointer"
                  >
                    <span className="text-[#b3b3b3] text-sm w-5 text-right">{i + 1}</span>
                    <SpotifyImage src={track.album?.images?.[2]?.url || track.album?.images?.[0]?.url} alt={track.name} className="w-10 h-10 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-[#1DB954] transition-colors">{track.name}</p>
                      <p className="text-xs text-[#b3b3b3] truncate">{track.artists?.map((a: { name: string }) => a.name).join(", ")} · {track.album?.name}</p>
                    </div>
                    <span className="text-xs text-[#b3b3b3]">{formatDuration(track.duration_ms)}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ArtistsTab() {
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const { data, loading } = useFetch<{ items: SpotifyArtist[] }>(`/api/spotify/top-artists?limit=20&time_range=${timeRange}`);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-black">Top Artists</h1>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
      <AnimatePresence mode="wait">
        {loading ? <LoadingSpinner /> : (
          <motion.div key={timeRange} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {data?.items?.map((artist, i) => (
              <motion.div
                key={artist.id}
                custom={i}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="w-full aspect-square rounded-full bg-[#282828] mb-4 flex items-center justify-center overflow-hidden">
                  <SpotifyImage src={artist.images?.[0]?.url} alt={artist.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <p className="font-bold truncate group-hover:text-[#1DB954] transition-colors">{artist.name}</p>
                <p className="text-xs text-[#b3b3b3] mt-1">{artist.genres?.[0] || "Artist"}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TracksTab() {
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const { data, loading } = useFetch<{ items: SpotifyTrack[] }>(`/api/spotify/top-tracks?limit=20&time_range=${timeRange}`);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-black">Top Tracks</h1>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
      <AnimatePresence mode="wait">
        {loading ? <LoadingSpinner /> : (
          <motion.div key={timeRange} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1">
            {data?.items?.map((track, i) => (
              <motion.div
                key={track.id}
                custom={i}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#181818] transition-colors group cursor-pointer"
              >
                <span className="text-[#b3b3b3] text-sm w-6 text-right font-mono">{i + 1}</span>
                <SpotifyImage src={track.album?.images?.[2]?.url || track.album?.images?.[0]?.url} alt={track.name} className="w-10 h-10 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-[#1DB954] transition-colors">{track.name}</p>
                  <p className="text-xs text-[#b3b3b3] truncate">{track.artists?.map((a: { name: string }) => a.name).join(", ")} · {track.album?.name}</p>
                </div>
                <span className="text-xs text-[#b3b3b3]">{formatDuration(track.duration_ms)}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RecentTab() {
  const { data, loading } = useFetch<{ items: RecentItem[] }>("/api/spotify/recently-played?limit=20");

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-3xl font-black mb-6 flex items-center gap-3">
        <Clock className="w-8 h-8 text-[#1DB954]" /> Recently Played
      </h1>
      <div className="space-y-1">
        {data?.items?.map((item, i) => (
          <motion.div
            key={`${item.track.id}-${item.played_at}`}
            custom={i}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#181818] transition-colors group cursor-pointer"
          >
            <SpotifyImage src={item.track.album?.images?.[2]?.url || item.track.album?.images?.[0]?.url} alt={item.track.name} className="w-10 h-10 rounded object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate group-hover:text-[#1DB954] transition-colors">{item.track.name}</p>
              <p className="text-xs text-[#b3b3b3]">{item.track.artists?.map((a: { name: string }) => a.name).join(", ")}</p>
            </div>
            <span className="text-xs text-[#b3b3b3] whitespace-nowrap">{timeAgo(item.played_at)}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PlaylistsTab() {
  const { data, loading } = useFetch<{ items: SpotifyPlaylist[]; total: number }>("/api/spotify/playlists");
  const [search, setSearch] = useState("");

  const filtered = data?.items?.filter(p => {
    if (!search.trim()) return true;
    return p.name.toLowerCase().includes(search.toLowerCase());
  }) || [];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <ListMusic className="w-8 h-8 text-[#1DB954]" /> Your Playlists
          <span className="text-base font-normal text-[#b3b3b3]">({data?.items?.length || 0})</span>
        </h1>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search playlists..."
            className="bg-[#181818] rounded-full pl-4 pr-4 py-2 text-sm text-white placeholder-[#666] outline-none focus:ring-1 focus:ring-[#1DB954] w-full sm:w-64 transition-all"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map((playlist, i) => (
          <motion.div
            key={playlist.id}
            custom={i}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-colors cursor-pointer group"
          >
            <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-[#282828] to-[#0a0a0a] mb-3 flex items-center justify-center overflow-hidden">
              {playlist.images?.[0]?.url ? (
                <img src={playlist.images[0].url} alt={playlist.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <ListMusic className="w-12 h-12 text-[#b3b3b3]" />
              )}
            </div>
            <p className="font-bold truncate group-hover:text-[#1DB954] transition-colors">{playlist.name}</p>
            <p className="text-xs text-[#b3b3b3] mt-1">{playlist.tracks?.total || 0} tracks</p>
          </motion.div>
        ))}
      </div>
      {filtered.length === 0 && !loading && (
        <p className="text-center text-[#666] py-12">No playlists match your search</p>
      )}
    </div>
  );
}

interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
  popularity: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

interface RecentItem {
  track: SpotifyTrack;
  played_at: string;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
}

export default function Dashboard({ activeTab }: DashboardProps) {
  const tabComponents: Record<DashboardTab, React.ReactNode> = {
    profile: <ProfileTab />,
    artists: <ArtistsTab />,
    tracks: <TracksTab />,
    recent: <RecentTab />,
    playlists: <PlaylistsTab />,
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#181818]/30 to-[#121212] min-h-screen">
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        {tabComponents[activeTab]}
      </div>
    </main>
  );
}
