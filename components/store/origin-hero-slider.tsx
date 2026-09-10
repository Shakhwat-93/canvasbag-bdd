"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SiteSettings } from "@/lib/types";

interface OriginHeroSliderProps {
  settings?: SiteSettings;
}

export function OriginHeroSlider({ settings = {} }: OriginHeroSliderProps) {
  const configuredList = [
    {
      image: settings.heroSliderImage1,
      link: settings.heroSliderLink1 || "/#best-sellers",
      alt: "CanvasBag Bangladesh Hero 1",
    },
    {
      image: settings.heroSliderImage2,
      link: settings.heroSliderLink2 || "/shop",
      alt: "CanvasBag Bangladesh Hero 2",
    },
    {
      image: settings.heroSliderImage3,
      link: settings.heroSliderLink3 || "/category/everyday-totes",
      alt: "CanvasBag Bangladesh Hero 3",
    },
    {
      image: settings.heroSliderImage4,
      link: settings.heroSliderLink4 || "/shop",
      alt: "CanvasBag Bangladesh Hero 4",
    },
    {
      image: settings.heroSliderImage5,
      link: settings.heroSliderLink5 || "/shop",
      alt: "CanvasBag Bangladesh Hero 5",
    },
  ].filter((s): s is { image: string; link: string; alt: string } => Boolean(s.image && typeof s.image === "string" && s.image.trim() !== ""));

  const defaultFallbackSlides = [
    {
      image: "/brand/hero-slider-1.webp",
      link: "/#best-sellers",
      alt: "CanvasBag Bangladesh Hero Offer",
    },
    {
      image: "/brand/hero-banner.webp",
      link: "/shop",
      alt: "CanvasBag Bangladesh Special Collection",
    },
    {
      image: "/brand/smart-travel-bag/black-color.webp",
      link: "/category/everyday-totes",
      alt: "CanvasBag Bangladesh Travel Gear",
    },
  ];

  const slides = configuredList.length > 0 ? configuredList : defaultFallbackSlides;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="bg-[#fafaf9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-[#111111] rounded-2xl md:rounded-[24px] border border-gray-200 shadow-md overflow-hidden group">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <Link href={slide.link} className="block w-full h-full relative">
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  sizes="(max-width: 1280px) 100vw, 1200px"
                  priority={idx === 0}
                  className="object-cover object-center w-full h-full"
                />
              </Link>
            </div>
          ))}

          {/* Left / Right Hover Buttons */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/60 text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/60 text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </>
          )}

          {/* Bottom Dot Indicators */}
          {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex
                      ? "w-6 h-2.5 md:w-8 md:h-3 bg-[#ff6b35] scale-105"
                      : "w-2.5 h-2.5 md:w-3 md:h-3 bg-white/60 hover:bg-white"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
