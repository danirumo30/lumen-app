'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth/infrastructure/contexts/AuthContext';
import LoginModal from '@/modules/auth/ui/components/LoginModal';

export default function Header() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, signOut, isLoading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    // Force full page reload to clear all state
    window.location.href = '/';
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="h-full px-6 flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 transform group-hover:scale-105 transition-transform duration-200">
              <span className="text-white font-bold text-sm tracking-wider">L</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
              Lumen
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium relative group"
            >
              Inicio
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/search"
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium relative group"
            >
              Buscar
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/rankings"
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium relative group"
            >
              Rankings
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-300" />
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Avatar + Username Combo */}
                <div className="relative group">
                  {/* Trigger area */}
                  <Link 
                    href={`/profile/${user.username || user.fullName || user.email?.split('@')[0]}`}
                    className="flex items-center space-x-3 hover:bg-zinc-800/50 px-3 py-2 rounded-lg transition-colors duration-200"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover border-2 border-zinc-700 group-hover:border-indigo-500 transition-colors"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-zinc-700 group-hover:border-indigo-500 transition-colors">
                        <span className="text-white text-xs font-semibold">
                          {user.username?.charAt(0).toUpperCase() || user.fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <span className="text-zinc-300 text-sm font-medium group-hover:text-white transition-colors">
                      {user.username || user.fullName || user.email?.split('@')[0]}
                    </span>
                  </Link>
                  
                  {/* Dropdown on hover */}
                  <div className="absolute right-0 top-full mt-1 w-56 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800/50">
                      <div className="flex items-center space-x-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {user.username?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-200 truncate">
                            {user.username || user.fullName || user.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <Link
                        href={`/profile/${user.username || user.fullName || user.email?.split('@')[0]}`}
                        className="flex items-center space-x-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Mi Perfil</span>
                      </Link>
                      <Link
                        href="/profile/edit"
                        className="flex items-center space-x-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Editar Perfil</span>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        disabled={isLoading}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={isLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'Cargando...' : 'Entrar'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
