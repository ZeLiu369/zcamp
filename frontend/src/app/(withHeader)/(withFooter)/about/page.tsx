// In frontend/src/app/about/page.tsx

import {
  Github,
  Link as LinkIcon,
  Coffee,
  User,
  Code,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

// A small helper component to display technology icons
const TechIcon = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-md text-sm">
    {children}
  </div>
);

export default function AboutPage() {
  // --- Replace these with your actual details ---
  const authorName = "Ze Liu"; // Replace with your name
  const projectRepoUrl = "https://github.com/ZeLiu369/zcamp";
  const githubProfileUrl = "https://github.com/ZeLiu369";
  const personalWebsiteUrl = "https://zeliu369.com/";
  const donationUrl = "https://buymeacoffee.com/zeliu";
  // --- End of details to replace ---

  return (
    <div className="bg-white dark:bg-black">
      <div className="container mx-auto max-w-4xl px-4 py-12 md:py-20">
        {/* Main Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
            About ZCamp
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Discover, share, and review the best camping spots.
          </p>
        </div>

        {/* Project Story Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">The Story</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            ZCamp was born from a passion for the great outdoors and the desire
            for a simple, community-driven platform to find and share the best
            camping experiences. This project was built from the ground up as a
            comprehensive full-stack application to showcase modern web
            development techniques, from interactive maps and secure
            authentication to cloud-based image handling and a responsive,
            animated user interface.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Key Features Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Key Features</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <li className="flex items-start gap-3">
              <CheckSquare className="h-5 w-5 mt-1 text-blue-500" />
              <span>
                Explore thousands of campgrounds on a high-performance,
                clustered map.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckSquare className="h-5 w-5 mt-1 text-blue-500" />
              <span>
                Secure user authentication with email/password and social logins
                (Google, Facebook, etc.).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckSquare className="h-5 w-5 mt-1 text-blue-500" />
              <span>
                Users can add new campgrounds with an interactive location
                picker.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckSquare className="h-5 w-5 mt-1 text-blue-500" />
              <span>
                Write, edit, and delete reviews with a 5-star rating system.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckSquare className="h-5 w-5 mt-1 text-blue-500" />
              <span>
                Upload, view, and delete campground photos with cloud storage
                via AWS S3.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckSquare className="h-5 w-5 mt-1 text-blue-500" />
              <span>
                Role-based access control for Admin users to manage all content.
              </span>
            </li>
          </ul>
        </section>

        <Separator className="my-8" />

        {/* Tech Stack Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Technology Stack</h2>
          <div className="flex flex-wrap gap-4">
            <TechIcon>Next.js</TechIcon>
            <TechIcon>React</TechIcon>
            <TechIcon>TypeScript</TechIcon>
            <TechIcon>Tailwind CSS</TechIcon>
            <TechIcon>Framer Motion</TechIcon>
            <TechIcon>Node.js</TechIcon>
            <TechIcon>Express.js</TechIcon>
            <TechIcon>PostgreSQL & PostGIS</TechIcon>
            <TechIcon>Passport.js</TechIcon>
            <TechIcon>JWT</TechIcon>
            <TechIcon>AWS S3</TechIcon>
            <TechIcon>Docker</TechIcon>
            <TechIcon>Redis</TechIcon>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Final Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User /> About the Author
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 2. Use a flex container to place the image and text side-by-side */}
              <div className="flex items-center gap-4">
                <Image
                  src="/image/avatar.webp" // The path to your image in the 'public' folder
                  alt={`Avatar of ${authorName}`}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
                <div className="flex-1 space-y-2">
                  <p>
                    This project was designed and developed by{" "}
                    <span className="font-bold">{authorName}</span>.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      <a
                        href={githubProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="mr-2 h-4 w-4" /> GitHub
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      <a
                        href={personalWebsiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LinkIcon className="mr-2 h-4 w-4" /> Website
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code /> The Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The source code for this project is open and available on
                GitHub. Feel free to check it out!
              </p>
              <Button asChild>
                <a
                  href={projectRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-4 w-4" /> View on GitHub
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Donation Section */}
        <div className="text-center mt-12">
          <h3 className="text-xl font-semibold mb-4">Support the Project</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            If you enjoyed this project, consider supporting its creator!
          </p>
          <Button asChild size="lg">
            <a href={donationUrl} target="_blank" rel="noopener noreferrer">
              <Coffee className="mr-2 h-5 w-5" /> Buy Me a Coffee or Donate Me
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
