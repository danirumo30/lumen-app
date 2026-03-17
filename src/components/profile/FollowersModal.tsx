"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Follower } from "@/modules/social/domain/user-profile";

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  followers: Follower[];
  following: Follower[];
  type: "followers" | "following";
}

export function FollowersModal({
  isOpen,
  onClose,
  followers,
  following,
  type,
}: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following">("followers");
  const list = type === "followers" ? followers : following;

  useEffect(() => {
    if (isOpen) {
      setActiveTab(type);
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-zinc-900/95 backdrop-blur-xl rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          <h3 className="text-white font-medium">
            {type === "followers" ? "Seguidores" : "Siguiendo"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800/50">
          <button
            onClick={() => setActiveTab("followers")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "followers"
                ? "text-white border-b-2 border-indigo-500"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Seguidores ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "following"
                ? "text-white border-b-2 border-indigo-500"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Siguiendo ({following.length})
          </button>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {(activeTab === "followers" ? followers : following).length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <p>No hay usuarios en esta lista</p>
            </div>
          ) : (
            (activeTab === "followers" ? followers : following).map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="relative">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {user.username}
                  </p>
                  {user.fullName && (
                    <p className="text-zinc-500 text-xs truncate">
                      {user.fullName}
                    </p>
                  )}
                </div>
                <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
