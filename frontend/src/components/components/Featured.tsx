// In src/components/Featured.tsx

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Star } from "lucide-react";
import Image from "next/image";
// Placeholder data until we connect to our API
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
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Featured Campgrounds
          </h2>
          <p className="max-w-[700px] mx-auto text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Discover top-rated locations shared by our community.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCampgrounds.map((camp) => (
            <Card key={camp.id} className="p-0 flex flex-col">
              <CardHeader className="p-0 relative h-60 rounded-t-xl overflow-hidden">
                <Image
                  src={camp.imageUrl}
                  alt={`Image of ${camp.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle>{camp.name}</CardTitle>
                <CardDescription className="mt-1">
                  {camp.province}
                </CardDescription>
                <div className="flex items-center mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={`star-${star}-${camp.id}`}
                      className={`h-5 w-5 ${
                        star < camp.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
