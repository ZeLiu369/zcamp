"use client";

import { useState } from "react";
import Link from "next/link";
import { MountainIcon, MenuIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMobileMenuOpen((open) => !open);
  };

  const handleLinkClick = () => {
    // close menu after navigating
    setMobileMenuOpen(false);
  };

  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-white border-b sticky top-0 z-50">
      <Link href="/" prefetch={false} className="flex items-center">
        <MountainIcon className="h-6 w-6" />
        <span className="sr-only">Campgrounds Inc</span>
      </Link>

      <nav className="ml-auto hidden lg:flex gap-4 sm:gap-6 items-center">
        <Link
          href="/explore"
          prefetch={false}
          className="text-sm font-medium hover:underline underline-offset-4"
        >
          Explore
        </Link>
        <Link
          href="/add"
          prefetch={false}
          className="text-sm font-medium hover:underline underline-offset-4"
        >
          Add a Campground
        </Link>
        <Link
          href="/about"
          prefetch={false}
          className="text-sm font-medium hover:underline underline-offset-4"
        >
          About
        </Link>
        <Button variant="outline" size="sm">
          Login
        </Button>
        <Button size="sm" asChild>
          <Link href="/signup">Sign up</Link>
        </Button>
      </nav>

      {/* mobile menu toggle */}
      <Button
        variant="outline"
        size="icon"
        className="ml-auto lg:hidden"
        onClick={toggleMenu}
      >
        {mobileMenuOpen ? (
          <XIcon className="h-6 w-6" />
        ) : (
          <MenuIcon className="h-6 w-6" />
        )}
        <span className="sr-only">Toggle navigation menu</span>
      </Button>

      {/* mobile menu content */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b shadow-md">
          <div className="flex flex-col py-4 space-y-2 px-4">
            <Link
              href="/explore"
              prefetch={false}
              onClick={handleLinkClick}
              className="text-base font-medium hover:underline"
            >
              Explore
            </Link>
            <Link
              href="/add"
              prefetch={false}
              onClick={handleLinkClick}
              className="text-base font-medium hover:underline"
            >
              Add a Campground
            </Link>
            <Link
              href="/about"
              prefetch={false}
              onClick={handleLinkClick}
              className="text-base font-medium hover:underline"
            >
              About
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLinkClick}
              asChild
            >
              Login
            </Button>

            <Button size="sm" className="w-full" asChild>
              <Link href="/signup" onClick={handleLinkClick}>
                Sign up
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
