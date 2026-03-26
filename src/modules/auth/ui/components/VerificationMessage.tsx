'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth/infrastructure/contexts/AuthContext';

interface VerificationMessageProps {
  onClose: () => void;
  email: string;
}

export default function VerificationMessage({ onClose, email }: VerificationMessageProps) {
  const { setRequiresVerification } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [canResend, setCanResend] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleResendVerification = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    setMessage('');
    setCanResend(false);
    setResendTimer(10);
    
    try {
      const response = await fetch('/api/auth/request-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage('Email reenviado');
      } else {
        setMessage(data.error || 'Error al reenviar email');
        
        setCanResend(true);
        setResendTimer(0);
      }
     } catch {
       setMessage('Error de conexión');
       setCanResend(true);
       setResendTimer(0);
     } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 text-center animate-fade-in">
      {}
      <div className="flex justify-center mb-6 relative">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 transform transition-transform hover:scale-105">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      {}
      <div className="space-y-3 mb-8">
        <h3 className="text-2xl font-bold text-white tracking-tight">
          ¡Cuenta creada exitosamente!
        </h3>
        <p className="text-zinc-400 text-base leading-relaxed">
          Por favor verifica tu correo electrónico usando el enlace que te hemos enviado.
        </p>
        <p className="text-zinc-500 text-xs">
          Revisa tu carpeta de spam si no ves el correo.
        </p>
      </div>

      {}
      {message && (
        <div className="mb-6 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg backdrop-blur-sm">
          <p className="text-sm text-zinc-300 break-all">{message}</p>
        </div>
      )}

      {}
      <div className="space-y-3">
        <button
          onClick={handleResendVerification}
          disabled={!canResend || isLoading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          {isLoading 
            ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </span>
            ) 
            : canResend 
              ? 'Reenviar email de verificación' 
              : `Reenviar en ${resendTimer}s`}
        </button>
        
        <button
          onClick={() => {
            setRequiresVerification(false);
            onClose();
          }}
          className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-all duration-200 border border-zinc-700 hover:border-zinc-600"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}