// src/components/Featured.tsx
import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";
import { CometCard } from "@/components/ui/comet-card";
import { InteractiveBackground } from "@/components/ui/InteractiveBackground";
// import { Star } from "lucide-react";

const featuredCampgrounds = [
  {
    id: "gros-morne",
    name: "Gros Morne National Park",
    province: "Newfoundland and Labrador",
    rating: 5,
    imageUrl: "/image/gros_morne_camp.jpg",
  },
  {
    id: "banff",
    name: "Banff National Park",
    province: "Alberta",
    rating: 5,
    imageUrl: "/image/banff_camp.jpg",
  },
  {
    id: "algonquin",
    name: "Algonquin Provincial Park",
    province: "Ontario",
    rating: 4,
    imageUrl: "/image/algonquin_camp.jpg",
  },
];

export function Featured() {
  return (
    <section className="w-full relative bg-transparent dark:bg-transparent">
      <InteractiveBackground className="rounded-none py-12 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <FadeIn>
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-black dark:text-white">
                Featured Campgrounds
              </h2>
              <p className="max-w-[700px] mx-auto text-gray-600 md:text-xl/relaxed dark:text-gray-400">
                Discover top-rated locations shared by our community.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCampgrounds.map((camp, index) => (
              <FadeIn key={camp.id} delay={index * 0.15}>
                <CometCard>
                  <div
                    className="flex flex-col items-stretch rounded-[16px] border-0 bg-gray-50/70 dark:bg-[#1F2121] p-2 backdrop-blur-sm cursor-pointer hover:shadow-2xl hover:shadow-blue-500/[0.2] transition-shadow duration-300"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: "none",
                      opacity: 1,
                    }}
                  >
                    {/* image container */}
                    <div className="mx-2 flex-1">
                      <div className="relative mt-2 aspect-[3/4] w-full">
                        <Image
                          src={camp.imageUrl}
                          fill
                          className="absolute inset-0 h-full w-full rounded-[16px] object-cover contrast-90"
                          alt={`Photo of ${camp.name}`}
                          priority
                          style={{
                            boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px",
                          }}
                        />
                      </div>
                    </div>

                    {/* information container */}
                    <div className="mt-2 flex-shrink-0 p-4">
                      {/* name and province */}
                      <div className="mb-3">
                        <h3 className="text-lg font-bold text-neutral-700 dark:text-white">
                          {camp.name}
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-300 mt-1">
                          {camp.province}
                        </p>
                      </div>

                      {/* rating and button */}
                      <div className="flex justify-between items-center">
                        {/* <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={`star-${i}-${camp.id}`}
                              className={`h-4 w-4 ${
                                i < camp.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div> */}

                        <Link
                          href={`/location/${camp.id}`}
                          className="px-3 py-1.5 rounded-lg bg-black dark:bg-white dark:text-black text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </CometCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </InteractiveBackground>
    </section>
  );
}
