'use client';

import { LuMapPin } from "react-icons/lu";
import { FaStar } from "react-icons/fa";
import Image from "next/image";
import { formatCurrency } from "@/util/utils";

export default function Card({
  title,
  subtitle,
  images,
  location,
  rating,
  pricing
}) {

  const cover = images.find((img) => img.isCover) || images[0];

  const hasDiscount =
    pricing?.originalPrice &&
    pricing?.finalPrice &&
    pricing.originalPrice > pricing.finalPrice;

  return (
    <div className="bg-surface w-full max-w-sm rounded-2xl overflow-hidden flex flex-col shadow-lg hover:shadow-xl/30 hover:cursor-pointer">
      <div className="relative">
        <Image
          src={cover.url}
          alt={cover.alt}
          width={400}
          height={250}
          className="w-full h-56 object-cover"
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute inset-0 p-3">
          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
              -{pricing.discountPercentage}% OFF
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-sm font-semibold">
            <LuMapPin className="h-4 w-4" />
            {location.city}, {location.country}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 flex flex-col justify-between grow">

        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-bold leading-tight">
              {title}
            </h3>

            <div className="flex items-center gap-1 text-sm font-bold">
              <FaStar className="text-yellow-400" />
              {rating.value}
            </div>
          </div>

          <p className="text-sm text-muted">
            {subtitle}
          </p>
        </div>

        {/* PRICE */}
        <Price pricing={pricing} />

      </div>
    </div>
  );
}

function Price({ pricing }) {

  if (!pricing) return null;

  const hasDiscount =
    pricing?.originalPrice &&
    pricing?.finalPrice &&
    pricing.originalPrice > pricing.finalPrice;

  const finalAmount =
    pricing.price ||
    pricing.finalPrice ||
    pricing.originalPrice;

  return (
    <div className="mt-4 space-y-1">

      {/* Espacio reservado para precio original */}
      <div className="min-h-5">
        {hasDiscount && (
          <p className="text-sm text-muted line-through">
            {formatCurrency({ amount: pricing.originalPrice, currency: pricing.currency })}
          </p>
        )}
      </div>

      {/* Precio principal */}
      <p className="text-2xl font-bold text-accent">
        {formatCurrency({ amount: finalAmount, currency: pricing.currency })}
      </p>

      {/* Texto por persona */}
      {pricing.pricePer && (
        <p className="text-sm text-muted">
          por {pricing.pricePer}
        </p>
      )}

    </div>
  );
}