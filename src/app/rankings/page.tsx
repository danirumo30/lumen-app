export const metadata = {
  title: "Rankings - Lumen",
  description: "Los usuarios más activos y内容创作 más populares de la comunidad Lumen.",
  openGraph: {
    title: "Rankings - Lumen",
    description: "Descubre los usuarios más activos de la comunidad",
    type: "website",
  },
};

export default function RankingsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-black">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Ranking<span className="text-amber-400">s</span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Los usuarios más activos de la comunidad
          </p>
        </div>

        {}
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-zinc-800/50 mb-6">
            <svg className="w-12 h-12 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Próximamente
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto">
            Los rankings globales y por categoría estarán disponibles pronto. 
            Mantente al tanto de las actualizaciones.
          </p>
        </div>
      </div>
    </main>
  );
}




