// In src/components/Featured.tsx

import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";
// 1. Import the new 3D Card components
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

// Your placeholder data remains the same
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
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-black">
      <div className="container mx-auto px-4 md:px-6">
        <FadeIn>
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-black dark:text-white">
              Featured Campgrounds
            </h2>
            <p className="max-w-[700px] mx-auto text-gray-500 md:text-xl/relaxed dark:text-gray-400">
              Discover top-rated locations shared by our community.
            </p>
          </div>
        </FadeIn>

        {/* 2. Replace the old grid with the new 3D Card logic */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCampgrounds.map((camp, index) => (
            <FadeIn key={camp.id} delay={index * 0.15}>
              <CardContainer className="inter-var">
                <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-blue-500/[0.2] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full h-auto rounded-xl p-6 border">
                  <CardItem
                    translateZ="50"
                    className="text-xl font-bold text-neutral-600 dark:text-white"
                  >
                    {camp.name}
                  </CardItem>

                  <CardItem
                    as="p"
                    translateZ="60"
                    className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
                  >
                    {camp.province}
                  </CardItem>

                  <CardItem translateZ="100" className="w-full mt-4">
                    <Image
                      src={camp.imageUrl}
                      height="1000"
                      width="1000"
                      className="h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl"
                      alt={`Photo of ${camp.name}`}
                      priority
                    />
                  </CardItem>

                  <div className="flex justify-between items-center mt-8">
                    <CardItem translateZ={20} className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={`star-${i}-${camp.id}`}
                          className={`h-5 w-5 ${
                            i < camp.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </CardItem>

                    <CardItem
                      translateZ={20}
                      as={Link}
                      href={`/location/${camp.id}`} // Link to the detail page
                      className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold"
                    >
                      View Details
                    </CardItem>
                  </div>
                </CardBody>
              </CardContainer>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
