import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-900 text-white">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <div className="max-w-xl mx-auto space-y-4">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Join the Community
          </h2>
          <p className="text-gray-400">
            Share your favorite spots, review campgrounds, and help others
            discover their next great adventure. Create an account to get
            started.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-200"
          >
            <Link href="/signup">Sign Up Now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
