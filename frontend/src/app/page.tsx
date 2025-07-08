import { Hero } from "@/components/components/Hero"; // Import our new Hero component
import { Featured } from "@/components/components/Featured";

export default function Home() {
  return (
    <main>
      <Hero />
      <Featured />
    </main>
  );
}
