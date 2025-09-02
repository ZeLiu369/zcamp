"use client";

import { useState } from "react";
import Link from "next/link";
import { MountainIcon, MenuIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { AddressSearch } from "./AddressSearch";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [addressQuery, setAddressQuery] = useState("");

  const toggleMenu = () => {
    setMobileMenuOpen((open) => !open);
  };

  const handleLinkClick = () => {
    // close menu after navigating
    setMobileMenuOpen(false);
  };

  const handleAddressSelect = ({
    latitude,
    longitude,
  }: {
    latitude: number;
    longitude: number;
  }) => {
    // We build a new URL with new coordinates and zoom level
    const newUrl = `/explore?lng=${longitude}&lat=${latitude}&zoom=14`;
    router.push(newUrl); // Command router to navigate to this new URL
  };

  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-white border-b sticky top-0 z-40">
      <Link href="/" prefetch={false} className="flex items-center">
        <MountainIcon className="h-6 w-6" />
        <span className="sr-only">Campgrounds Inc</span>
      </Link>

      {pathname === "/explore" && (
        <div className="flex-1 mx-4">
          <AddressSearch
            query={addressQuery}
            setQuery={setAddressQuery}
            onSelect={handleAddressSelect}
          />
        </div>
      )}

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
        {isLoading ? (
          <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse"></div>
        ) : user ? ( // NOSONAR
          <>
            <Link
              href="/profile"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              My Profile
            </Link>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </>
        )}
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
            {isLoading ? (
              <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse"></div>
            ) : user ? ( // NOSONAR
              <>
                <Link
                  href="/profile"
                  className="text-sm font-medium hover:underline underline-offset-4"
                >
                  My Profile
                </Link>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
