import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const carouselImages = [
  "https://mahabub2030.github.io/KFIAPROJICET/img/Nabatat_BG.jpg",
  // "https://afm-div.com/wp-content/uploads/2026/06/safety-pic.png",
  "https://kfia.sa/-/media/Project/Daco-Digital-Channels/KFIA/Driving-Directions-Banner.jpg?h=418&iar=0&w=1120&hash=934B8B07F45C7313C4E84754B4E88ECA",
  // "https://afm-div.com/wp-content/uploads/2026/04/badkground.png",
  "https://mahabub2030.github.io/KFIAPROJICET/img/Nabatat_BG.jpg",
  "https://alwofod.sa/wp-content/uploads/2024/02/Receiving-passengers.jpg",
];

export default function Herosections() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );
  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <main className="relative w-full h-[120vh] min-h-[500px] max-h-[500px] overflow-hidden bg-black text-white">
      {/* Half Screen Embla Viewport */}
      <div className="h-full w-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full w-full">
          {carouselImages.map((src, index) => (
            <div
              key={index}
              className="relative h-full w-full flex-[0_0_100%] min-w-0"
            >
              {/* Image filling 100% of the half-screen container */}
              <img
                src={src}
                alt={`Slide ${index + 1}`}
                className="h-full w-full object-cover object-center"
                loading={index === 0 ? "eager" : "lazy"}
              />

              {/* Dark Overlay for Text Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

              {/* Hero Overlay Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-md">
                  Welcome to EMS
                </h1>
                <p className="mt-2 text-sm sm:text-base md:text-lg text-gray-200 max-w-xl drop-shadow">
                  Grounds &amp; Landscaping Management System
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        aria-label="Previous Slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/70 hover:scale-105 active:scale-95 border border-white/20"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={scrollNext}
        aria-label="Next Slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/70 hover:scale-105 active:scale-95 border border-white/20"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Bottom Floating Pagination Dots */}
      <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
        {carouselImages.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              selectedIndex === i
                ? "w-6 bg-white"
                : "w-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </main>
  );
}
