import { DiscoverClient } from "@/components/discover/DiscoverClient";

export const metadata = {
  title: "Discover - Lumen",
  description: "Explora películas, series y juegos. Filtra por género, año, proveedores de streaming y más.",
  openGraph: {
    title: "Discover - Lumen",
    description: "Explora contenido audiovisual con filtros avanzados",
    type: "website",
  },
};

export default function DiscoverPage() {
  return <DiscoverClient />;
}




