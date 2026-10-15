"use client";
import { cn } from "cn";
import Image from "next/image";
import { useEffect, useState } from "react";

// Photos are Blobs in IndexedDB; an object URL lets <Image> show one until unmount.
function useObjectUrl(blob: Blob) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);
  return url;
}

export function ItemPhoto({
  photo,
  alt,
  className,
}: {
  photo: Blob;
  alt: string;
  className?: string;
}) {
  const url = useObjectUrl(photo);
  if (!url) return null;
  return (
    <Image
      src={url}
      alt={alt}
      width={96}
      height={96}
      unoptimized
      className={cn("shrink-0 rounded-md object-cover", className)}
    />
  );
}
