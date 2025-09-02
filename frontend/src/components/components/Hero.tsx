// In src/components/Hero.tsx - REFINED HIGHLIGHTING LOGIC
"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight";

export function Hero() {
  const headline = "Discover Your Next Adventure";
  // Define specific phrases to highlight
  const highlightPhrases = ["Adventure"];

  // Helper function to render text with highlights
  const renderHighlightedText = () => {
    const result = [];
    let currentText = headline;

    highlightPhrases.forEach((phrase) => {
      const parts = currentText.split(phrase);

      // Add text before the phrase
      if (parts[0]) {
        result.push(parts[0]);
      }

      // Add the highlighted phrase
      result.push(
        <Highlight key={phrase} className="text-blue-500">
          {phrase}
        </Highlight>
      );

      // Update currentText to process remaining part
      currentText = parts.slice(1).join(phrase); // In case phrase appears multiple times
    });

    // Add any remaining text
    if (currentText) {
      result.push(currentText);
    }

    // Wrap any plain strings in spans for consistent spacing
    return result.map((item, index) =>
      typeof item === "string" ? (
        <span key={`plain-${index}`}>
          {item.split(" ").map((word, i) => (
            <span key={i}>{word} </span>
          ))}
        </span>
      ) : (
        item
      )
    );
  };

  return (
    <HeroHighlight className="w-full py-20 md:py-32 lg:py-40 bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <motion.h1
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: [20, -5, 0],
        }}
        transition={{
          duration: 0.6,
          ease: [0.4, 0.0, 0.2, 1],
        }}
        className="max-w-4xl mx-auto text-center font-bold text-neutral-700 dark:text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-snug tracking-tighter"
      >
        {renderHighlightedText()}
      </motion.h1>

      <motion.p
        className="text-gray-500 md:text-xl dark:text-gray-400 mt-4 max-w-2xl mx-auto text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        Find and review the best campgrounds across North America. Your journey
        starts here.
      </motion.p>
      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}
      >
        <Button size="lg">Explore Campgrounds</Button>
      </motion.div>
    </HeroHighlight>
  );
}
