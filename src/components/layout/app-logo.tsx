"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/branding/app-logo.png";

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

/** Shows /branding/app-logo.png when present, falling back to the "CM"
 * gradient badge (used before a real logo file was supplied) otherwise —
 * so the app keeps working whether or not the file exists. */
export function AppLogo({ className }: { className?: string }) {
  const exists = useImageExists(LOGO_SRC);

  if (!exists) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--oro-claro)] to-[var(--oro-hondo)] font-bold text-[#1a1200] shadow-lg shadow-[var(--oro-hondo)]/30",
          className
        )}
      >
        CM
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="Club de Monetización"
      className={cn("rounded-xl object-cover shadow-lg", className)}
    />
  );
}
