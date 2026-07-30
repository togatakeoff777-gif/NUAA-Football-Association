import Image from "next/image";
import type { ReactNode } from "react";

type NewsImageProps = {
  src: string;
  alt: string;
  variant: "featured" | "list";
  sizes: string;
  className?: string;
  children?: ReactNode;
};

export function NewsImage({
  src,
  alt,
  variant,
  sizes,
  className,
  children,
}: NewsImageProps) {
  return (
    <div className={`shared-news-image shared-news-image-${variant}${src.startsWith("/brand/") ? " shared-news-image-brand" : ""}${className ? ` ${className}` : ""}`}>
      <Image src={src} alt={alt} fill sizes={sizes} />
      {children}
    </div>
  );
}
