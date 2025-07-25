import Link from "next/link";
import { MountainIcon } from "lucide-react"; // Added Compass icon
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-white border-b sticky top-0 z-50">
      <Link
        href="#"
        className="flex items-center justify-center"
        prefetch={false}
      >
        <MountainIcon className="h-6 w-6" />
        <span className="sr-only">Campgrounds Inc</span>
      </Link>
      <nav className="ml-auto hidden lg:flex gap-4 sm:gap-6 items-center">
        <Link
          href="/explore"
          className="text-sm font-medium hover:underline underline-offset-4"
          prefetch={false}
        >
          Explore
        </Link>
        <Link
          href="/add"
          className="text-sm font-medium hover:underline underline-offset-4"
          prefetch={false}
        >
          Add a Campground
        </Link>
        <Link
          href="/add"
          className="text-sm font-medium hover:underline underline-offset-4"
          prefetch={false}
        >
          About
        </Link>
        <Button variant="outline" size="sm">
          Login
        </Button>
        <Button size="sm">Sign Up</Button>
      </nav>
      {/* You can implement a mobile sheet menu here later */}
      <Button variant="outline" size="icon" className="ml-auto lg:hidden">
        <MountainIcon className="h-6 w-6" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>
    </header>
  );
}
