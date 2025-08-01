import { Hero } from "@/components/components/Hero";
import { Featured } from "@/components/components/Featured";
import { CTA } from "@/components/components/CTA";

export default function Home() {
  return (
    <main>
      <Hero />
      <Featured />
      <CTA />
    </main>
  );
}
