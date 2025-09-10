// src/components/Featured.tsx
import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";
import { CometCard } from "@/components/ui/comet-card";
import { InteractiveBackground } from "@/components/ui/InteractiveBackground";

const featuredCampgrounds = [
  {
    id: "gros-morne",
    name: "Trout River Campground",
    province: "Gros Morne National Park Newfoundland and Labrador",
    rating: 5,
    imageUrl: "/image/gros_morne_camp.jpg",
    link: "/location/e2b11eba-b3f8-489d-80f8-854d15b8b53d",
  },
  {
    id: "banff",
    name: "Tunnel Mountain Village I Campground",
    province: "Banff National Park - Alberta",
    rating: 5,
    imageUrl: "/image/banff_camp.jpg",
    link: "/location/8bb76cc2-15f6-4141-9f20-5d4418e68495",
  },
  {
    id: "Green Point",
    name: "Green Point Campground",
    province: "Long Beach - British Columbia",
    rating: 4,
    imageUrl: "/image/camp_star.jpg",
    link: "/location/64f5c7ff-fc6c-402b-b387-d7fd81dee9bf",
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
                  <Link href={camp.link} className="block">
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
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                        {/* <div className="flex justify-between items-center">
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

                        {/* <Link
                          href={`/location/${camp.id}`}
                          className="px-3 py-1.5 rounded-lg bg-black dark:bg-white dark:text-black text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          View Details
                        </Link>
                      </div> */}

                        <div className="flex justify-end items-center">
                          <span className="px-3 py-1.5 rounded-lg bg-black dark:bg-white dark:text-black text-white text-xs font-semibold hover:opacity-90 transition-opacity">
                            View Details
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </CometCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </InteractiveBackground>
    </section>
  );
}
