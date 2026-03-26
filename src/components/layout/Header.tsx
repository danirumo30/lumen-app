'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/modules/auth/infrastructure/contexts/AuthContext';
import LoginModal from '@/modules/auth/ui/components/LoginModal';

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [avatarCacheKey, setAvatarCacheKey] = useState(0);
  const { user, signOut, isLoading } = useAuth();
  const pathname = usePathname();

  // Update avatar cache key when user data changes (e.g., after profile update)
   
  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarCacheKey(prev => prev + 1);
    }
  }, [user?.avatarUrl]);

  // Helper to get avatar URL with cache busting
  const getAvatarUrl = (url: string): string => {
    // Add cache-busting query param to force browser to reload image
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${avatarCacheKey}`;
  };

  // Close menus on route change
   
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const closeUserMenu = useCallback(() => setIsUserMenuOpen(false), []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="h-full px-4 md:px-6 flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 md:space-x-3 group" onClick={closeMobileMenu}>
            <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 transform group-hover:scale-105 transition-transform duration-200 overflow-hidden">
              <Image
                src="/images/lumen-logo.png"
                alt="Lumen Logo"
                width={36}
                height={36}
                className="object-cover"
              />
            </div>
            <span className="text-lg md:text-xl font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors hidden sm:inline">
              Lumen
            </span>
          </Link>

           {/* Desktop Navigation */}
           <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
             <Link
               href="/"
               className="text-zinc-400 hover:text-white transition-colors text-sm font-medium relative group"
             >
               Inicio
               <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-300" />
             </Link>
             <Link
               href="/discover"
               className="text-zinc-400 hover:text-white transition-colors text-sm font-medium relative group"
             >
               Descubrir
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

          {/* User Menu / Login Button */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {user ? (
              <div className="relative">
                {/* Mobile: Avatar button */}
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="md:hidden flex items-center justify-center"
                >
                  {user.avatarUrl ? (
                    <img
                      src={getAvatarUrl(user.avatarUrl)}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover border-2 border-zinc-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {user.username?.charAt(0).toUpperCase() || user.fullName?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </button>

                {/* Desktop: Avatar + Username with hover */}
                <div className="hidden md:block relative group">
                  <Link 
                    href={`/profile/${user.username || user.fullName || user.email?.split('@')[0]}`}
                    className="flex items-center space-x-2 hover:bg-zinc-800/50 px-3 py-2 rounded-lg transition-colors duration-200"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={getAvatarUrl(user.avatarUrl)}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover border-2 border-zinc-700 group-hover:border-indigo-500 transition-colors"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-zinc-700 group-hover:border-indigo-500 transition-colors">
                        <span className="text-white text-xs font-semibold">
                          {user.username?.charAt(0).toUpperCase() || user.fullName?.charAt(0).toUpperCase() || 'U'}
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
                           <Image
                             src={getAvatarUrl(user.avatarUrl!)}
                             alt="Avatar"
                             width={40}
                             height={40}
                             className="rounded-full object-cover"
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
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span>Mi Perfil</span>
                      </Link>
                      <Link href="/profile/edit" className="flex items-center space-x-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <span>Editar Perfil</span>
                      </Link>
                      <button onClick={handleSignOut} disabled={isLoading} className="w-full flex items-center space-x-3 px-4 py-2.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile User Menu Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-xl shadow-2xl z-50 overflow-hidden md:hidden">
                    <div className="p-4 border-b border-zinc-800/50">
                       <div className="flex items-center space-x-3">
                         {user.avatarUrl ? (
                           <Image
                             src={getAvatarUrl(user.avatarUrl)}
                             alt="Avatar"
                             width={40}
                             height={40}
                             className="rounded-full object-cover"
                           />
                         ) : (
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                             <span className="text-white text-sm font-semibold">{user.username?.charAt(0).toUpperCase() || 'U'}</span>
                           </div>
                         )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-200 truncate">{user.username || user.fullName || user.email?.split('@')[0]}</p>
                          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <Link 
                        href={`/profile/${user.username || user.fullName || user.email?.split('@')[0]}`} 
                        onClick={closeUserMenu}
                        className="flex items-center space-x-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span>Mi Perfil</span>
                      </Link>
                      <Link href="/profile/edit" onClick={closeUserMenu} className="flex items-center space-x-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <span>Editar Perfil</span>
                      </Link>
                      <button onClick={handleSignOut} disabled={isLoading} className="w-full flex items-center space-x-3 px-4 py-3 text-zinc-400 hover:text-red-400 hover:bg-red-500/10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={isLoading}
                className="px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? '...' : 'Entrar'}
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/50">
            <nav className="flex flex-col p-4 space-y-2">
              <Link href="/" onClick={closeMobileMenu} className="flex items-center px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Inicio
              </Link>
              <Link href="/discover" onClick={closeMobileMenu} className="flex items-center px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s-8-4.5-8-11.8V6l8-2.5 8 2.5v4.2c0 7.3-8 11.8-8 11.8z" /></svg>
                Descubrir
              </Link>
              <Link href="/search" onClick={closeMobileMenu} className="flex items-center px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Buscar
              </Link>
              <Link href="/rankings" onClick={closeMobileMenu} className="flex items-center px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Rankings
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Login Modal */}
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
