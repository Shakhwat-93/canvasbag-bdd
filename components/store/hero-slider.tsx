"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Slide {
  image: string;
  link?: string;
}

interface HeroSliderProps {
  slides: Slide[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [slides.length]);

  if (!slides || slides.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="relative w-full overflow-hidden shadow-xs">
        <div
          className="flex transition-transform duration-500 ease-out w-full"
          style={{ transform: `translateX(-${activeIdx * 100}%)` }}
        >
          {slides.map((slide, idx) => {
            const content = (
              <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] min-h-[160px] sm:min-h-[220px] md:min-h-[320px]">
                <Image
                  src={slide.image}
                  alt={`Promo Offer ${idx + 1}`}
                  fill
                  priority={idx === 0}
                  className="object-cover w-full h-full block"
                  sizes="100vw"
                />
              </div>
            );

            return (
              <div key={idx} className="w-full shrink-0 relative">
                {slide.link && slide.link !== "#" ? (
                  <Link href={slide.link} className="block w-full">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </div>
            );
          })}
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition-all cursor-pointer ${
                  idx === activeIdx ? "bg-[var(--primary)] scale-110 shadow-xs" : "bg-white/70 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
