"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginView from "@/components/LoginView";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import WrappedExperience from "@/components/WrappedExperience";
import YearSelector from "@/components/YearSelector";

type DashboardTab = "profile" | "artists" | "tracks" | "recent" | "playlists";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#282828] border-t-[#1DB954] rounded-full animate-spin" />
        <p className="text-[#b3b3b3] text-sm">Connecting to Spotify...</p>
      </div>
    </div>
  );
}

interface WrappedSelection {
  label: string;
  playlistId: string;
  type: "playlist" | "current_year";
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>("profile");
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [wrappedSelection, setWrappedSelection] = useState<WrappedSelection | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleOptionSelected = (label: string, playlistId: string, type: "playlist" | "current_year") => {
    setShowYearSelector(false);
    setWrappedSelection({ label, playlistId, type });
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onGenerateWrapped={() => setShowYearSelector(true)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <Dashboard activeTab={activeTab} />
      </div>

      <AnimatePresence>
        {showYearSelector && (
          <YearSelector
            onSelect={handleOptionSelected}
            onClose={() => setShowYearSelector(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {wrappedSelection && (
          <WrappedExperience
            label={wrappedSelection.label}
            playlistId={wrappedSelection.playlistId}
            type={wrappedSelection.type}
            onClose={() => setWrappedSelection(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
