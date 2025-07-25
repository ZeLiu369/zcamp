import { Button } from "@/components/ui/button"; // Import the button

export function Hero() {
  return (
    <section className="w-full py-20 md:py-32 lg:py-40 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Discover Your Next Adventure
          </h1>
          <p className="text-gray-500 md:text-xl dark:text-gray-400">
            Find and review campgrounds across North America. Your journey
            starts here.
          </p>
        </div>
        <div className="mt-6">
          <Button size="lg">Explore Campgrounds</Button>
        </div>
      </div>
    </section>
  );
}
