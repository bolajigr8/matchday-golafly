"use client";

import Image from "next/image";

interface TrainingFacilityProps {
  images: string[];
}

export default function TrainingFacility({ images }: TrainingFacilityProps) {
  if (!images || images.length === 0) return null;

  return (
    <section className="relative w-full bg-lp-bg pb-[30px] sm:pb-[40px] lg:pb-[60px]">
      <div className="container-custom px-custom">
        {/* Details Card - Cream/Beige matching the Tour Details design style */}
        <div className="bg-[#b4ff39] border border-[#b4ff39]/90 rounded-[6px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.3)] p-6 sm:p-8 lg:p-[40px]">
          <div className="mb-8">
            <h2 className="text-[#3e2723] text-[20px] sm:text-[24px] lg:text-[28px] font-bold uppercase tracking-wide mb-3">
              Training Facility &amp; Accommodation
            </h2>
            <p className="text-[#5c4d44] text-[16px] lg:text-[18px]">
              Train at world-class facilities and stay in a top-rated hotel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-[#d4c5b0] shadow-md group"
              >
                <Image
                  src={img}
                  alt={`Facility Image ${idx + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
