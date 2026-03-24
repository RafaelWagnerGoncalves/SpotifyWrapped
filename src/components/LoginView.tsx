"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Music2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginView() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setError(err);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#181818] to-[#0a0a0a] flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md bg-[#121212] rounded-2xl p-8 md:p-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Music2 className="w-10 h-10 text-[#1DB954]" />
            <span className="text-3xl font-bold tracking-tight">Spotify</span>
          </div>
          <p className="text-[#b3b3b3] text-sm">
            Log in to your Wrapped 2025
          </p>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div variants={itemVariants} className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 text-sm font-semibold">Authentication failed</p>
              <p className="text-red-400/70 text-xs mt-0.5">Error: {error}</p>
            </div>
          </motion.div>
        )}

        {/* Spotify Login Button */}
        <motion.div variants={itemVariants} className="space-y-4 mb-6">
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Continue with Spotify
          </button>
        </motion.div>

        {/* Info */}
        <motion.div variants={itemVariants} className="text-center">
          <p className="text-[#b3b3b3] text-xs leading-relaxed">
            You&apos;ll be redirected to Spotify to authorize access to your listening data.
            We use this to generate your personalized Wrapped 2025 experience.
          </p>
        </motion.div>

        {/* Scopes Info */}
        <motion.div variants={itemVariants} className="mt-6 pt-6 border-t border-[#282828]">
          <p className="text-[#b3b3b3] text-xs mb-3 font-semibold uppercase tracking-wider">What we access:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-[#b3b3b3]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
              Your profile info
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
              Top artists & tracks
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
              Recently played
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
              Your playlists
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
