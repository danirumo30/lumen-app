import { Suspense } from "react";
import HomeContent from "./home-content";
import { HomepageSkeleton } from "@/components/home/CarouselSkeleton";

export const metadata = {
  title: "Lumen - Discover Movies, TV & Games",
  description: "Tu centro cultural definitivo: películas, series, juegos y rankings. Conecta con otros usuarios y descubre nuevo contenido.",
  openGraph: {
    title: "Lumen - Discover Movies, TV & Games",
    description: "Tu centro cultural definitivo: películas, series, juegos y rankings.",
    type: "website",
    locale: "es_ES",
  },
};

export default async function HomePage() {
  return (
    <Suspense fallback={<HomepageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}




