"use client";

import { useEffect, useState } from "react";

interface ErrorToastProps {
  /** The error message to display */
  message: string;
  /** Called when retry is clicked */
  onRetry?: () => void;
  /** Called when toast is dismissed */
  onDismiss: () => void;
  /** How long to show the toast (ms). Default: 5000 */
  duration?: number;
  /** Type of toast: error (red) or success (green) */
  type?: "error" | "success";
}

/**
 * Toast notification component for displaying error/success messages
 * 
 * Features:
 * - Auto-dismiss after duration
 * - Retry button for error toasts
 * - Animated entrance/exit
 * 
 * @example
 * ```tsx
 * <ErrorToast
 *   message="No se pudieron guardar los cambios"
 *   onRetry={() => mutation.mutate(variables)}
 *   onDismiss={() => toast.dismiss()}
 *   type="error"
 * />
 * ```
 */
export function ErrorToast({
  message,
  onRetry,
  onDismiss,
  duration = 5000,
  type = "error",
}: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 200); // Wait for exit animation
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      handleDismiss();
    }
  };

  const bgColor = type === "error" ? "bg-rose-500/90" : "bg-emerald-500/90";
  const iconColor = type === "error" ? "text-white" : "text-white";

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50
        ${bgColor}
        text-white
        px-4 py-3
        rounded-lg
        shadow-lg
        flex items-center gap-3
        min-w-[280px] max-w-md
        transition-all duration-200 ease-out
        ${isVisible && !isExiting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${iconColor}`}>
        {type === "error" ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Message */}
      <p className="flex-1 text-sm font-medium">{message}</p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {type === "error" && onRetry && (
          <button
            onClick={handleRetry}
            className="
              px-3 py-1.5
              bg-white/20 hover:bg-white/30
              rounded-md
              text-sm font-medium
              transition-colors
            "
          >
            Reintentar
          </button>
        )}

        <button
          onClick={handleDismiss}
          className="
            p-1.5
            hover:bg-white/20
            rounded-md
            transition-colors
          "
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Hook to manage a collection of toasts
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { toasts, showToast, dismissToast } = useToasts();
 *   
 *   const handleSave = async () => {
 *     try {
 *       await save();
 *       showToast("Guardado exitosamente", "success");
 *     } catch {
 *       showToast("Error al guardar", "error", () => handleSave());
 *     }
 *   };
 *   
 *   return (
 *     <>
 *       <button onClick={handleSave}>Guardar</button>
 *       {toasts.map(toast => (
 *         <ErrorToast
 *           key={toast.id}
 *           {...toast}
 *           onDismiss={() => dismissToast(toast.id)}
 *         />
 *       ))}
 *     </>
 *   );
 * }
 * ```
 */
interface Toast {
  id: string;
  message: string;
  type: "error" | "success";
  onRetry?: () => void;
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: "error" | "success" = "error",
    onRetry?: () => void
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: Toast = { id, message, type, onRetry };
    setToasts((prev) => [...prev, toast]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, showToast, dismissToast };
}
