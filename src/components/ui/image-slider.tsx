
import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import VideoPlayer from './video-player';
import { Video } from '@/types';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  duration?: number;
}

interface ImageSliderProps {
  images?: string[];
  videos?: Video[];
  className?: string;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ images = [], videos = [], className }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();

  // Combine images and videos into a single media array
  const mediaItems: MediaItem[] = [
    ...images.map(url => ({ type: 'image' as const, url })),
    ...videos.map(video => ({ 
      type: 'video' as const, 
      url: video.url, 
      thumbnail: video.thumbnail,
      duration: video.duration 
    }))
  ];

  React.useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [api]);

  if (!mediaItems || mediaItems.length === 0) return null;

  // Check if we have any videos to determine sizing
  const hasVideos = videos && videos.length > 0;

  if (mediaItems.length === 1) {
    const item = mediaItems[0];
    return (
      <div className={cn("relative w-full", className)}>
        <div className="w-full overflow-hidden rounded-lg bg-gray-100">
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt="Post media"
              className="w-full h-auto object-contain"
            />
          ) : (
            <VideoPlayer
              src={item.url}
              thumbnail={item.thumbnail}
              className="w-full"
              maintainAspectRatio={true}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      <Carousel 
        className="w-full" 
        setApi={setApi}
        opts={{
          align: "center",
          loop: false,
          dragFree: true,
          containScroll: "trimSnaps"
        }}
      >
        <CarouselContent className="ml-0">
          {mediaItems.map((item, index) => (
            <CarouselItem key={index} className="pl-0">
              <div className="relative w-full">
                <div className="w-full overflow-hidden rounded-lg bg-gray-100">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`Media ${index + 1}`}
                      className="w-full h-auto object-contain"
                    />
                  ) : (
                    <VideoPlayer
                      src={item.url}
                      thumbnail={item.thumbnail}
                      className="w-full"
                      autoplay={index === currentIndex}
                      maintainAspectRatio={true}
                    />
                  )}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      
      {/* Media count indicator in top right */}
      {mediaItems.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm font-medium z-10">
          {currentIndex + 1}/{mediaItems.length}
        </div>
      )}
      
      {/* Dot indicators at bottom */}
      {mediaItems.length > 1 && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
          {mediaItems.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300 cursor-pointer",
                index === currentIndex ? "bg-white scale-125" : "bg-white/60 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
