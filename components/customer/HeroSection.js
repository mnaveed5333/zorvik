"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Replace with real slides from your backend / CMS later
const slides = [
  {
    id: 1,
    title: "Shop from 100+ trusted vendors",
    subtitle: "Everything from electronics to fashion, all in one place",
    cta: "Shop Now",
    ctaLink: "/shop",
    image: "/img1.png", // Cloudinary URL in production
  },
  {
    id: 2,
    title: "New vendors join every week",
    subtitle: "Discover fresh stores and exclusive deals",
    cta: "Explore Stores",
    ctaLink: "/stores",
    image: "/img2.png",
  },
  {
    id: 3,
    title: "Order easily via WhatsApp",
    subtitle: "No account needed — just message and order",
    cta: "Learn More",
    ctaLink: "/about",
    image: "/img3.png",
  },
];

export default function HeroSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full overflow-hidden rounded-2xl bg-[#EC3237]">
      {/* Slides */}
      <div className="relative h-[280px] sm:h-[360px] md:h-[440px] w-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === active ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Background image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            {/* Overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-10 md:p-14 text-white">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight max-w-lg">
                {slide.title}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-white/90 max-w-md">
                {slide.subtitle}
              </p>
              <Link
                href={slide.ctaLink}
                className="mt-5 inline-flex w-fit items-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#EC3237] transition-colors hover:bg-[#C7D8EA]"
              >
                {slide.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Dots navigation */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setActive(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2 rounded-full transition-all ${
              index === active ? "w-6 bg-white" : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}