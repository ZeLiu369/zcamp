// In src/components/Hero.tsx
"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
// We only need the Highlight component, not the HeroHighlight wrapper
import { Highlight } from "@/components/ui/hero-highlight";
import Link from "next/link";
import Image from "next/image";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";

export function Hero() {
  const subheadingWords = [
    { text: "Find" },
    { text: "and" },
    { text: "review" },
    { text: "the" },
    { text: "best" },
    { text: "campgrounds" },
    { text: "across" },
    { text: "North" },
    { text: "America." },
  ];

  return (
    // 1. Use a standard <section> tag as the main container
    <section className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
      {/* 2. Add your custom background image and a dark overlay */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/image/star_camping.avif"
          alt="Scenic campsite with a mountain view"
          fill
          className="object-cover"
          priority
          quality={80}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* 3. Place all your content in a container layered on top */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [20, -5, 0] }}
          transition={{ duration: 4.0, ease: [0.4, 0.0, 0.2, 1] }}
          className="max-w-4xl mx-auto text-center font-bold text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-snug tracking-tighter"
        >
          Discover Your Next{" "}
          {/* 4. Use only the <Highlight> component on the word you want */}
          <Highlight>Adventure</Highlight>
        </motion.h1>

        {/* <motion.p
          className="text-gray-200 md:text-xl mt-4 max-w-2xl mx-auto text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          Find and review the best campgrounds across North America. Your
          journey starts here.
        </motion.p> */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <TypewriterEffectSmooth
            words={subheadingWords}
            // className="text-gray-200 md:text-xl mt-4 max-w-2xl mx-auto text-center"
            className="mt-4 max-w-2xl mx-auto"
            textClassName="text-white md:text-2xl font-bold text-center"
            cursorClassName="bg-blue-400 w-[3px] h-[0.8em] md:h-8 rounded-full" // Optional: customize the cursor color
          />
        </motion.div>

        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <Button asChild size="lg">
            <Link href="/explore">Explore Campgrounds</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
