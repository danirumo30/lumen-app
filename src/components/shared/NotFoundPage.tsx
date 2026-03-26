import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">404 - Página no encontrada</h1>
        <p className="mb-4">La página que buscas no existe.</p>
        <Link href="/" className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500 transition">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
