"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function ColorPicker({
  value,
  onChange,
  presets,
  label,
}: {
  value: string;
  onChange: (color: string) => void;
  presets: string[];
  label: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="focus-ring flex items-center gap-2 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--ink-0)]"
        >
          <span
            className="h-4 w-4 rounded-full ring-1 ring-white/20"
            style={{ background: value }}
          />
          <span className="text-[var(--ink-1)]">{label}</span>
          <span className="ml-auto font-mono text-xs text-[var(--ink-3)]">
            {value}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56">
        <div className="grid grid-cols-8 gap-1.5">
          {presets.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={cn(
                "h-6 w-6 rounded-full ring-1 ring-white/15 transition hover:scale-110",
                value.toLowerCase() === c.toLowerCase() &&
                  "ring-2 ring-[var(--accent)]"
              )}
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-[var(--panel-border)] pt-3">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="focus-ring h-8 flex-1 rounded-md border border-[var(--panel-border)] bg-[var(--panel)] px-2 font-mono text-xs text-[var(--ink-0)]"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
