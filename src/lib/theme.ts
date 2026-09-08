import type { CSSProperties } from "react";

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return { r: 11, g: 15, b: 25 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Builds the CSS custom properties that theme the whole app shell (glass
 * panels, text, focus ring) based on the user's chosen accent + page
 * background, so a light background flips panels/text without needing a
 * second set of Tailwind classes anywhere.
 */
export function buildThemeVars(
  accentColor: string,
  backgroundColor: string
): CSSProperties {
  const isLight = relativeLuminance(backgroundColor) > 0.6;

  return {
    "--accent": accentColor,
    "--bg-color": backgroundColor,
    "--ink-0": isLight ? "#0f172a" : "#f8fafc",
    "--ink-1": isLight ? "#334155" : "#cbd5e1",
    "--ink-2": isLight ? "#475569" : "#94a3b8",
    "--ink-3": isLight ? "#64748b" : "#64748b",
    "--panel": isLight ? "rgba(15,23,42,0.045)" : "rgba(255,255,255,0.045)",
    "--panel-strong": isLight
      ? "rgba(15,23,42,0.08)"
      : "rgba(255,255,255,0.075)",
    "--panel-border": isLight
      ? "rgba(15,23,42,0.1)"
      : "rgba(255,255,255,0.09)",
  } as CSSProperties;
}
