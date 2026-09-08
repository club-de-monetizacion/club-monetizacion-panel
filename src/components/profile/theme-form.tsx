"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/profile/color-picker";
import { AnimatedBackground } from "@/components/layout/animated-background";
import { updateTheme } from "@/app/actions/profile";
import { cn } from "@/lib/utils";
import {
  ACCENT_PRESETS,
  BACKGROUND_PRESETS,
  BACKGROUND_TYPE_INFO,
} from "@/lib/constants";
import type { BackgroundType } from "@prisma/client";

const TYPES: BackgroundType[] = ["PARTICLES", "AURORA", "GRADIENT", "SOLID"];

export function ThemeForm({
  initial,
}: {
  initial: {
    accentColor: string;
    backgroundColor: string;
    backgroundType: BackgroundType;
    particlesEnabled: boolean;
  };
}) {
  const { update } = useSession();
  const router = useRouter();
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [backgroundColor, setBackgroundColor] = useState(initial.backgroundColor);
  const [backgroundType, setBackgroundType] = useState(initial.backgroundType);
  const [animated, setAnimated] = useState(initial.particlesEnabled);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    startTransition(async () => {
      await updateTheme({
        accentColor,
        backgroundColor,
        backgroundType,
        particlesEnabled: animated,
      });
      await update();
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="relative h-40 overflow-hidden rounded-xl ring-1 ring-[var(--panel-border)]">
        <AnimatedBackground
          type={backgroundType}
          color={backgroundColor}
          accent={accentColor}
          animated={animated}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="glass-panel-strong rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--ink-0)]">
            Vista previa en vivo
          </span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-3)]">
          Tipo de fondo
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setBackgroundType(t)}
              className={cn(
                "focus-ring rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-2.5 text-left text-xs transition",
                backgroundType === t &&
                  "ring-2 ring-[var(--accent)] border-transparent"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--ink-0)]">
                  {BACKGROUND_TYPE_INFO[t].label}
                </span>
                {backgroundType === t && (
                  <Check className="h-3.5 w-3.5 text-[var(--accent)]" />
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-[var(--ink-3)]">
                {BACKGROUND_TYPE_INFO[t].description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <ColorPicker
          value={accentColor}
          onChange={setAccentColor}
          presets={ACCENT_PRESETS}
          label="Color de acento"
        />
        <ColorPicker
          value={backgroundColor}
          onChange={setBackgroundColor}
          presets={BACKGROUND_PRESETS}
          label="Color de fondo"
        />
      </div>

      <div className="glass-panel flex items-center justify-between rounded-lg px-3.5 py-2.5">
        <div>
          <Label htmlFor="animate-bg" className="normal-case tracking-normal">
            Animar fondo
          </Label>
          <p className="text-xs text-[var(--ink-3)]">
            Desactívalo si prefieres un fondo estático
          </p>
        </div>
        <Switch id="animate-bg" checked={animated} onCheckedChange={setAnimated} />
      </div>

      {saved && !isPending && (
        <p className="text-sm text-emerald-400">Apariencia guardada.</p>
      )}

      <Button type="button" onClick={save} disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Guardar apariencia
      </Button>
    </div>
  );
}
