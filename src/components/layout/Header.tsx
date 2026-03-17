'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/modules/auth/infrastructure/contexts/AuthContext';
import LoginModal from '@/modules/auth/ui/components/LoginModal';

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, signOut, isLoading } = useAuth();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800">
        <div className="h-full px-6 flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-zinc-100">
              Lumen
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm font-medium"
            >
              Inicio
            </Link>
            <Link
              href="/discover"
              className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm font-medium"
            >
              Descubrir
            </Link>
            <Link
              href="/library"
              className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm font-medium"
            >
              Mi Biblioteca
            </Link>
            <Link
              href="/rankings"
              className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm font-medium"
            >
              Rankings
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="relative group">
                  <Link href={`/profile/${user.username || user.fullName || user.email?.split('@')[0]}`}>
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-zinc-700 cursor-pointer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center border border-zinc-700 cursor-pointer">
                        <span className="text-white text-sm font-medium">
                          {user.username?.charAt(0) || user.fullName?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </Link>
                  {/* Dropdown on hover */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-3 border-b border-zinc-800">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {user.username || user.fullName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href={`/profile/${user.username || user.fullName || user.email?.split('@')[0]}`}
                      className="block w-full text-left px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      href="/profile/edit"
                      className="block w-full text-left px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      Editar Perfil
                    </Link>
                    <button
                      onClick={signOut}
                      disabled={isLoading}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
                {/* Username visible */}
                <Link 
                  href={`/profile/${user.username || user.fullName || user.email?.split('@')[0]}`}
                  className="text-zinc-300 text-sm hidden md:inline hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  {user.username || user.fullName || user.email?.split('@')[0]}
                </Link>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-indigo-600/25 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'Cargando...' : 'Login / Register'}
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