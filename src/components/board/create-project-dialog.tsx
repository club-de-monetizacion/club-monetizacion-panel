"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/profile/color-picker";
import { createProject } from "@/app/actions/projects";
import { PLATFORM_INFO, PLATFORM_ORDER, ACCENT_PRESETS } from "@/lib/constants";
import { PlatformIcon } from "@/components/ui/platform-icon";
import type { Platform } from "@prisma/client";

export function CreateProjectDialog({
  open,
  onOpenChange,
  defaultPlatform,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlatform?: Platform;
}) {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>(defaultPlatform ?? "YOUTUBE");
  const [color, setColor] = useState("#6366f1");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("platform", platform);
    formData.set("color", color);

    startTransition(async () => {
      const result = await createProject(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Nuevo proyecto</DialogTitle>
        <DialogDescription>
          Agrupa piezas de contenido y vincula su material de trabajo en Drive.
        </DialogDescription>

        <form action={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required autoFocus className="mt-1.5" />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" rows={2} className="mt-1.5" />
          </div>

          <div>
            <Label>Plataforma</Label>
            <Select
              value={platform}
              onValueChange={(v) => setPlatform(v as Platform)}
              disabled={!!defaultPlatform}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_ORDER.map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="flex items-center gap-1.5">
                      <PlatformIcon platform={p} className="h-3.5 w-3.5" />
                      {PLATFORM_INFO[p].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="driveLink">Enlace de Drive</Label>
            <Input
              id="driveLink"
              name="driveLink"
              type="url"
              placeholder="https://drive.google.com/…"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Color</Label>
            <ColorPicker
              value={color}
              onChange={setColor}
              presets={ACCENT_PRESETS}
              label="Color del proyecto"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear proyecto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
