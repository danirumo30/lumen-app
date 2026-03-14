'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Componente PasswordInput reutilizable con icono de mostrar/ocultar
function PasswordInput({ value, onChange, placeholder, disabled, required, showRequirements }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  showRequirements?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 pr-10 bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email'); // Email para redirigir con el campo pre-llenado
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(true);
  const [submitTimer, setSubmitTimer] = useState(0);

  // Temporizador de 10 segundos para evitar spam
  useEffect(() => {
    if (submitTimer > 0) {
      const timer = setTimeout(() => {
        setSubmitTimer(submitTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanSubmit(true);
    }
  }, [submitTimer]);

  const validatePassword = (pwd: string): boolean => {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }

    if (!validatePassword(password)) {
      setMessage('La contraseña no cumple los requisitos de seguridad');
      return;
    }

    if (!canSubmit) return;

    setIsLoading(true);
    setMessage('');
    setCanSubmit(false);
    setSubmitTimer(10);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Contraseña restablecida exitosamente. Redirigiendo al login...');
        // Redirigir al login con el email pre-llenado (usando el email de la respuesta de la API)
        const redirectEmail = data.email || email;
        const redirectUrl = redirectEmail 
          ? `/login?email=${encodeURIComponent(redirectEmail)}`
          : '/login';
        router.push(redirectUrl);
      } else {
        setMessage(data.error || 'Error al restablecer la contraseña');
        // Permitir reintentar después del error
        setCanSubmit(true);
        setSubmitTimer(0);
      }
    } catch (error) {
      setMessage('Error de conexión');
      setCanSubmit(true);
      setSubmitTimer(0);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 text-center">
          <h1 className="text-xl text-white mb-4">Token inválido</h1>
          <p className="text-zinc-400">El enlace de restablecimiento es inválido o ha expirado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Restablecer contraseña</h1>
        <p className="text-zinc-400 text-center mb-6">Ingresa tu nueva contraseña</p>
        
        {message && (
          <div className={`p-3 rounded-lg mb-4 ${message.includes('exitosamente') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Nueva contraseña
            </label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              showRequirements
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Confirmar contraseña
            </label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !canSubmit}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading 
              ? 'Restableciendo...' 
              : !canSubmit 
                ? `Espera ${submitTimer}s...` 
                : 'Restablecer contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
