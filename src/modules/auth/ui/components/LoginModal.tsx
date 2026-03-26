'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/modules/auth/infrastructure/contexts/AuthContext';
import VerificationMessage from './VerificationMessage';

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

function PasswordInput({ value, onChange, placeholder, disabled, required }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 pr-10 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
          placeholder={placeholder}
          required={required}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signIn, signUp, isLoading, error, clearError, requiresVerification, setRequiresVerification } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [resetTimer, setResetTimer] = useState(0);

  
  const canSendReset = resetTimer === 0;

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
  };

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setFullName('');
    setUsername('');
    clearError();
    setRequiresVerification(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    if (isLogin) {
      try {
        await signIn(email, password);
        onClose();
      } catch {  }
    } else {
      try {
        await signUp(email, password, fullName, username);
      } catch {  }
    }
  };

  const handleModalClose = () => {
    setRequiresVerification(false);
    setIsForgotPassword(false);
    onClose();
  };

  useEffect(() => {
    if (resetTimer <= 0) {
      return;
    }
    const timer = setTimeout(() => setResetTimer((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resetTimer]);

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSendReset) return;
    
    setForgotPasswordMessage('');
    setResetTimer(10); 
    
    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setForgotPasswordMessage('Si el email existe, recibirás un enlace.');
      } else {
        setForgotPasswordMessage(data.error || 'Error al enviar el email');
        setResetTimer(0);
      }
    } catch {
      setForgotPasswordMessage('Error de conexión');
      setResetTimer(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleModalClose} />
      
      {}
      <div className="relative bg-zinc-900/95 backdrop-blur-xl rounded-2xl border border-zinc-800/50 shadow-2xl w-full max-w-md p-6">
        {}
        <button
          onClick={handleModalClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {requiresVerification ? 'Verifica tu email' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </h2>
          <p className="text-zinc-400 text-sm">
            {requiresVerification 
              ? 'Hemos enviado un enlace de verificación a tu email'
              : (isLogin ? 'Bienvenido de nuevo' : 'Únete a la comunidad')
            }
          </p>
        </div>

        {}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

         {}
         {requiresVerification && (
           <VerificationMessage email={email} onClose={handleModalClose} />
         )}

        {}
        {isForgotPassword && !requiresVerification && (
          <div className="mb-6 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <h3 className="text-lg font-semibold text-white mb-3">Recuperar contraseña</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!canSendReset}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200"
              >
                {canSendReset ? 'Enviar enlace' : `Espera ${resetTimer}s`}
              </button>
              {forgotPasswordMessage && (
                <p className={`text-sm ${forgotPasswordMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                  {forgotPasswordMessage}
                </p>
              )}
            </form>
          </div>
        )}

        {}
        {!requiresVerification && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Nombre completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  placeholder="Juan Pérez"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Contraseña</label>
               <PasswordInput
                 value={password}
                 onChange={handlePasswordChange}
                 placeholder="••••••••"
                 required
               />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Nombre de usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  placeholder="juanperez"
                  required={!isLogin}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200"
            >
              {isLoading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </button>
          </form>
        )}

        {}
        <div className="mt-6 text-center space-y-2">
          {isLogin && !isForgotPassword && (
            <button
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {(isForgotPassword || !isLogin) && (
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setForgotPasswordMessage('');
                setResetTimer(0);
                setForgotPasswordEmail('');
              }}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {isLogin ? 'Volver al login' : 'Volver'}
            </button>
          )}

          <p className="text-sm text-zinc-500">
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button
              type="button"
              onClick={handleSwitchMode}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {isLogin ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
