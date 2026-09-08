"use client";

import { useEffect, useState } from "react";
import type { Platform } from "@prisma/client";
import { PLATFORM_INFO } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Skool and Actualizaciones Skool share the same brand logo file. */
function logoSlug(platform: Platform) {
  return platform === "SKOOL_UPDATES" ? "skool" : platform.toLowerCase();
}

/** Checks the image out-of-band with a plain Image() object instead of an
 * <img onError>, since a very fast (e.g. localhost) 404 can fire the native
 * error event before React finishes hydrating and attaches the listener,
 * permanently losing it and leaving a broken-image glyph on screen. */
function useImageExists(src: string) {
  const [exists, setExists] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => !cancelled && setExists(true);
    img.onerror = () => !cancelled && setExists(false);
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return exists;
}

/** Shows the real platform logo from /branding/platforms/<slug>.png when
 * present, falling back to the emoji used before a logo file was supplied
 * — so every call site keeps working whether or not the file exists yet. */
export function PlatformIcon({
  platform,
  className,
}: {
  platform: Platform;
  className?: string;
}) {
  const info = PLATFORM_INFO[platform];
  const src = `/branding/platforms/${logoSlug(platform)}.png`;
  const exists = useImageExists(src);

  if (!exists) {
    return <span className={className}>{info.emoji}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={info.label} className={cn("object-contain", className)} />
  );
}
