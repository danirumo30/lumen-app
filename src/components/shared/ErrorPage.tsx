'use client';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Algo salió mal</h1>
        <p className="mb-4 text-red-400">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500 transition">
          Reintentar
        </button>
      </div>
    </div>
  );
}
