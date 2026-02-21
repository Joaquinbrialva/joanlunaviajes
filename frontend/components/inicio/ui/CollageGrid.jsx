'use client';

import Image from "next/image";
import { useMemo } from "react";

function shuffleArray(array) {
  const newArray = [...array];

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }

  return newArray;
}

export default function CollageGrid({ destinations = [] }) {

  const processed = useMemo(() => {
    if (!destinations.length) return [];

    // Prioridad visual: popular o featured primero
    const sorted = [...destinations].sort((a, b) => {
      if (a.isPopular) return -1;
      if (b.isPopular) return 1;
      if (a.isFeatured) return -1;
      if (b.isFeatured) return 1;
      return 0;
    });

    const shuffledRest = shuffleArray(sorted.slice(1));

    return [sorted[0], ...shuffledRest].slice(0, 4);
  }, [destinations]);

  if (processed.length < 4) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[190px] gap-4">

      {/* Imagen grande */}
      <CollageItem item={processed[0]} large />

      {/* Derecha */}
      <CollageItem item={processed[1]} />
      <CollageItem item={processed[2]} />
      <CollageItem item={processed[3]} wide />

    </div>
  );
}

function CollageItem({ item, large = false, wide = false }) {
  console.log(item)
  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden
        group cursor-pointer
        transition-all duration-500 ease-out
        animate-fadeIn
        ${large ? "col-span-2 row-span-2" : ""}
        ${wide ? "col-span-2" : ""}
      `}
    >
      <Image
        src={item.featuredImage}
        alt={item.slug}
        fill
        className="
          object-cover
          transition-transform duration-700 ease-out
          group-hover:scale-110
        "
      />

      {/* Overlay adaptable a dark mode */}
      <div className="
        absolute inset-0
        bg-linear-to-t
        from-black/70 via-black/30 to-transparent
        dark:from-black/80
      " />

      <div className="absolute bottom-4 left-4 text-white">
        <h3 className={`font-bold ${large ? "text-2xl" : "text-lg"}`}>
          {item.name}, {item.country}
        </h3>

        {item.shortDescription && (large || wide) && (
          <p className="text-sm opacity-90 mt-1 max-w-xs">
            {item.shortDescription}
          </p>
        )}
      </div>
    </div>
  );
}