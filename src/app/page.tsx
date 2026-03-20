import { Suspense } from "react";
import HomeContent from "./home-content";
import { HomepageSkeleton } from "@/components/home/CarouselSkeleton";

export default async function HomePage() {
  return (
    <Suspense fallback={<HomepageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
