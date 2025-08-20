"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import Image from "next/image";

interface CampgroundImage {
  id: string;
  url: string;
}

interface ImagePreviewProps {
  images: CampgroundImage[];
  locationId: string;
}

export function ImagePreview({ images, locationId }: ImagePreviewProps) {
  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-xl">
        <p className="text-gray-500">No photos yet.</p>
      </div>
    );
  }

  const previewImages = images.slice(0, 3);
  const mainImage = previewImages.length > 0 ? previewImages.at(0) : null;
  const smallImages = previewImages.slice(1, 3);

  return (
    // 修改 1: 容器默认为普通div，只在md屏幕及以上尺寸时才应用网格布局
    <div className="relative h-96 rounded-xl overflow-hidden md:grid md:grid-cols-5 md:gap-2">
      {/* 左侧: 主图 */}
      {mainImage && (
        // 修改 2: 在md屏幕及以上尺寸时，此容器才占据3列
        <div className="w-full h-full md:col-span-3 md:row-span-2 relative md:rounded-xl">
          <Image
            src={mainImage.url}
            alt="Main campground"
            fill
            className="object-cover rounded-xl md:rounded-xl" // 手机上也要有圆角
            priority={true}
            sizes="(max-width: 768px) 100vw, 60vw" // 这个逻辑是正确的
          />
        </div>
      )}

      {/* 右侧: 小图 */}
      {/* 修改 3: 这个容器在手机上默认隐藏 (hidden)，只在md及以上屏幕显示为网格 (md:grid) */}
      <div className="hidden md:grid col-span-2 row-span-2 grid-rows-2 gap-2">
        {smallImages.map((img, index) => (
          <div key={img.id} className="relative overflow-hidden rounded-xl">
            <Image
              src={img.url}
              alt={`Campground thumbnail ${index + 1}`}
              fill
              className="object-cover" // className中 object-cover 已足够
              priority={true}
              // 修改 4: 为小图也添加sizes属性，提升性能
              // 在桌面端，它们占据 2/5 的宽度，即 40vw
              sizes="(max-width: 768px) 0px, 40vw"
            />
          </div>
        ))}
        {smallImages.length < 2 && <div />}
      </div>

      {/* "Show all photos" 按钮 */}
      {/* 修改 5: 将按钮移到右下角，这在手机和桌面上都是更常见的UI模式 */}
      <div className="absolute bottom-4 right-4">
        <Button asChild>
          <Link href={`/location/${locationId}/photos`}>
            <Camera className="mr-2 h-4 w-4" /> Show all photos
          </Link>
        </Button>
      </div>
    </div>
  );
}
