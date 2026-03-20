"use client";

import { useState } from "react";
import type { UserProfileWithContent } from "@/modules/social/domain/user-profile";
import type { Media } from "@/modules/shared/domain/media";
import { MediaGrid } from "./MediaGrid";

interface MediaTabsProps {
  content: UserProfileWithContent;
}

type TabType = "series" | "movies" | "games";
type SubTabType = "watched" | "favorites";

export function MediaTabs({ content }: MediaTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("series");
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("watched");

  const getMediaList = (): Media[] => {
    switch (activeTab) {
      case "series":
        return activeSubTab === "watched" ? content.watchedTvShows : content.favoriteTvShows;
      case "movies":
        return activeSubTab === "watched" ? content.watchedMovies : content.favoriteMovies;
      case "games":
        return activeSubTab === "watched" ? content.watchedGames : content.favoriteGames;
      default:
        return [];
    }
  };

  const mediaList = getMediaList();

  return (
    <div className="space-y-6">
      {/* Main Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-8" aria-label="Media categories">
          {[
            { id: "series" as TabType, label: "Series", icon: "📺" },
            { id: "movies" as TabType, label: "Películas", icon: "🎬" },
            { id: "games" as TabType, label: "Videojuegos", icon: "🎮" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-4">
        {[
          { id: "watched" as SubTabType, label: "Vistos" },
          { id: "favorites" as SubTabType, label: "Favoritos" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeSubTab === tab.id
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      {mediaList.length > 0 ? (
        <MediaGrid mediaList={mediaList} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay contenido en esta categoría</p>
        </div>
      )}
    </div>
  );
}
