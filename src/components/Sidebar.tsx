"use client";

import { motion } from "framer-motion";
import {
  User,
  Mic2,
  Music,
  Clock,
  ListMusic,
  Sparkles,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type DashboardTab = "profile" | "artists" | "tracks" | "recent" | "playlists";

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onGenerateWrapped: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { key: DashboardTab; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "artists", label: "Top Artists", icon: Mic2 },
  { key: "tracks", label: "Top Tracks", icon: Music },
  { key: "recent", label: "Recent", icon: Clock },
  { key: "playlists", label: "Playlists", icon: ListMusic },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  onGenerateWrapped,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { logout, user } = useAuth();

  return (
    <motion.aside
      className="h-screen bg-black flex flex-col border-r border-[#282828]/50 sticky top-0"
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            {user?.images?.[0]?.url ? (
              <img src={user.images[0].url} alt={user.display_name || ""} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-bold text-sm">
                {user?.display_name?.charAt(0) || "R"}
              </div>
            )}
            <span className="text-sm font-semibold truncate">
              {user?.display_name || "User"}
            </span>
          </motion.div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-full hover:bg-[#181818] transition-colors text-[#b3b3b3] hover:text-white"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? "bg-[#181818] text-white"
                  : "text-[#b3b3b3] hover:text-white hover:bg-[#181818]/50"
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#1DB954]" : ""}`} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1 h-4 bg-[#1DB954] rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Generate Wrapped Button */}
      <div className="px-2 pb-2">
        <button
          onClick={onGenerateWrapped}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-black transition-all hover:scale-[1.02] active:scale-[0.98] ${
            collapsed ? "px-2" : "px-4"
          }`}
          style={{
            background: "linear-gradient(135deg, #1DB954, #1ed760, #1DB954, #15a049)",
            backgroundSize: "200% 200%",
          }}
        >
          <Sparkles className="w-5 h-5 flex-shrink-0 animate-pulse" />
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Gerar Wrapped 2025
            </motion.span>
          )}
        </button>
      </div>

      {/* Logout */}
      <div className="px-2 pb-4">
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#b3b3b3] hover:text-white hover:bg-[#181818]/50 transition-all text-sm ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Log Out
            </motion.span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
