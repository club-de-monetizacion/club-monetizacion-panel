"use client";

import { useRef, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/app/actions/profile";
import { fileToCompressedDataUrl } from "@/lib/image";

export function ProfileForm({
  initialName,
  initialBio,
  initialImage,
  email,
}: {
  initialName: string;
  initialBio: string;
  initialImage: string | null;
  email: string;
}) {
  const { update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialImage);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setPreview(dataUrl);
    } catch {
      setError("No se pudo procesar la imagen");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    if (preview) formData.set("image", preview);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      await update();
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar src={preview} name={initialName} email={email} size={72} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="focus-ring absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-[#1a1200] shadow-lg"
            aria-label="Cambiar foto"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--ink-0)]">Foto de perfil</p>
          <p className="text-xs text-[var(--ink-3)]">JPG o PNG. Se ajusta automáticamente.</p>
        </div>
      </div>

      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" defaultValue={initialName} required className="mt-1.5" />
      </div>

      <div>
        <Label htmlFor="email">Correo</Label>
        <Input id="email" value={email} disabled className="mt-1.5 opacity-60" />
      </div>

      <div>
        <Label htmlFor="bio">Biografía</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={initialBio}
          rows={3}
          maxLength={280}
          placeholder="Cuéntale al equipo a qué te dedicas…"
          className="mt-1.5"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && !isPending && (
        <p className="text-sm text-emerald-400">Perfil actualizado.</p>
      )}

      <Button type="submit" disabled={isPending || uploading}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  );
}
