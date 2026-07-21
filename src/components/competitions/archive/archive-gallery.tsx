import Image from "next/image";

import type { ArchiveGalleryImage } from "@/types";

type ArchiveGalleryProps = {
  images: readonly ArchiveGalleryImage[];
  ariaLabel: string;
  className?: string;
};

export function ArchiveGallery({ images, ariaLabel, className }: ArchiveGalleryProps) {
  return (
    <div className={`cup-gallery-balanced${className ? ` ${className}` : ""}`} aria-label={ariaLabel}>
      {images.map((image) => (
        <figure key={image.src}>
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading="lazy"
            sizes="(max-width: 720px) 100vw, (max-width: 1080px) 50vw, 33vw"
          />
        </figure>
      ))}
    </div>
  );
}
