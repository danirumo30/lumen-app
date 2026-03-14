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
  showRequirements?: boolean;
}

function PasswordInput({ value, onChange, placeholder, disabled, required, showRequirements }: PasswordInputProps) {
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
      {showRequirements && value && (
        <div className="mt-2 space-y-1 pl-2">
          <div className="flex items-center text-xs">
            <span className={`w-2 h-2 rounded-full mr-2 ${value.length >= 8 ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className={value.length >= 8 ? 'text-green-400' : 'text-zinc-500'}>
              Mínimo 8 caracteres
            </span>
          </div>
          <div className="flex items-center text-xs">
            <span className={`w-2 h-2 rounded-full mr-2 ${/[A-Z]/.test(value) ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className={/[A-Z]/.test(value) ? 'text-green-400' : 'text-zinc-500'}>
              Una mayúscula
            </span>
          </div>
          <div className="flex items-center text-xs">
            <span className={`w-2 h-2 rounded-full mr-2 ${/[a-z]/.test(value) ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className={/[a-z]/.test(value) ? 'text-green-400' : 'text-zinc-500'}>
              Una minúscula
            </span>
          </div>
          <div className="flex items-center text-xs">
            <span className={`w-2 h-2 rounded-full mr-2 ${/[0-9]/.test(value) ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className={/[0-9]/.test(value) ? 'text-green-400' : 'text-zinc-500'}>
              Un número
            </span>
          </div>
        </div>
      )}
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
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [canSendReset, setCanSendReset] = useState(true);
  const [resetTimer, setResetTimer] = useState(0);

  // Validación en tiempo real de la contraseña
  const validatePasswordRealTime = (pwd: string): string[] => {
    const errors: string[] = [];
    
    if (pwd.length < 8) {
      errors.push('Mínimo 8 caracteres');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Una mayúscula');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('Una minúscula');
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push('Un número');
    }
    
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (!isLogin) {
      setPasswordErrors(validatePasswordRealTime(value));
    }
  };

  // Reset form when switching between login/register
  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setFullName('');
    setUsername('');
    clearError();
    // Reset verification state when switching modes
    setRequiresVerification(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (isLogin) {
      try {
        await signIn(email, password);
        onClose();
      } catch {
        // Error handled in AuthContext
      }
    } else {
      try {
        await signUp(email, password, fullName, username);
        // No cerramos el modal si requiresVerification es true
        // El mensaje de verificación se mostrará automáticamente
      } catch {
        // Error handled in AuthContext
      }
    }
  };

  // Handle modal close - reset verification state
  const handleModalClose = () => {
    setRequiresVerification(false);
    setIsForgotPassword(false);
    onClose();
  };

  // Temporizador para el botón de enviar enlace de reset
  useEffect(() => {
    if (resetTimer > 0) {
      const timer = setTimeout(() => {
        setResetTimer(resetTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanSendReset(true);
    }
  }, [resetTimer]);

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSendReset) return;
    
    setForgotPasswordMessage('');
    setCanSendReset(false);
    setResetTimer(10);
    
    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setForgotPasswordMessage('Si el email existe, recibirás un enlace para restablecer tu contraseña.');
      } else {
        setForgotPasswordMessage(data.error || 'Error al enviar el email');
        setCanSendReset(true);
        setResetTimer(0);
      }
    } catch (error) {
      setForgotPasswordMessage('Error de conexión');
      setCanSendReset(true);
      setResetTimer(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        onClick={handleModalClose}
      />

      {/* Modal Content */}
      <div className="relative bg-zinc-950/90 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 animate-fade-in">
        {/* Header */}
        <div className="p-8 border-b border-zinc-800/50 bg-zinc-900/30">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {requiresVerification ? 'Verificación' : (isLogin ? 'Bienvenido' : 'Crear cuenta')}
            </h2>
            <button
              type="button"
              onClick={handleModalClose}
              className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded-full"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-zinc-400">
            {requiresVerification
              ? 'Confirma tu correo electrónico'
              : isLogin
              ? 'Accede a tu biblioteca de media'
              : 'Únete a Lumen y empieza a trackear'}
          </p>
        </div>

        {/* Content based on state */}
        {requiresVerification ? (
          <VerificationMessage onClose={handleModalClose} email={email} />
        ) : isForgotPassword ? (
          // Forgot Password Form
          <form onSubmit={handleForgotPassword} className="p-8 space-y-5">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white">Restablecer contraseña</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>
            
            {forgotPasswordMessage && (
              <div className="p-4 bg-indigo-900/20 border border-indigo-800/50 rounded-xl">
                <p className="text-indigo-400 text-sm text-center">{forgotPasswordMessage}</p>
              </div>
            )}

            <div className="group">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-400 transition-colors">
                Email
              </label>
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
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-600/30 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canSendReset ? 'Enviar enlace' : `Espera ${resetTimer}s...`}
            </button>

            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="w-full py-2 text-zinc-400 hover:text-white transition-colors text-sm"
            >
              Volver a iniciar sesión
            </button>
          </form>
        ) : (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl animate-fade-in">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Full Name (Register only) */}
              {!isLogin && (
                <div className="group">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-400 transition-colors">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                    placeholder="Tu nombre"
                    required={!isLogin}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Username (Register only) */}
              {!isLogin && (
                <div className="group">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-400 transition-colors">
                    Nombre de usuario
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                    placeholder="usuario123"
                    required={!isLogin}
                    disabled={isLoading}
                    pattern="[a-zA-Z0-9_]{3,20}"
                    title="Solo letras, números y guiones bajos (3-20 caracteres)"
                  />
                </div>
              )}

              {/* Email */}
              <div className="group">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-400 transition-colors">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  placeholder="tu@email.com"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="group">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-400 transition-colors">
                  Contraseña
                </label>
                <PasswordInput
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  showRequirements={!isLogin}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
                  </>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="px-8 py-4 bg-zinc-900/30 border-t border-zinc-800/50">
              <div className="flex flex-col items-center space-y-2">
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
                <p className="text-center text-sm text-zinc-500">
                  {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                  <button
                    type="button"
                    onClick={handleSwitchMode}
                    disabled={isLoading}
                    className="ml-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors disabled:opacity-50 hover:underline"
                  >
                    {isLogin ? 'Regístrate' : 'Inicia sesión'}
                  </button>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}