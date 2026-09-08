"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X } from "lucide-react";
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
import { createTask } from "@/app/actions/tasks";
import { PRIORITY_INFO } from "@/lib/constants";
import { fileToCompressedDataUrl } from "@/lib/image";
import type { Platform, TaskType } from "@prisma/client";

type Member = { id: string; name: string | null; email: string };
type ProjectOption = { id: string; name: string };

export function CreateTaskDialog({
  open,
  onOpenChange,
  type,
  platform,
  initialColumnField,
  initialColumnValue,
  members,
  projects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: TaskType;
  platform?: Platform;
  initialColumnField: "status" | "stage";
  initialColumnValue: string;
  members: Member[];
  projects?: ProjectOption[];
}) {
  const router = useRouter();
  const isContent = type === "CONTENIDO";
  const isSkoolUpdate = platform === "SKOOL_UPDATES";
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [priority, setPriority] = useState("MEDIA");
  const [assigneeId, setAssigneeId] = useState<string>("none");
  const [projectId, setProjectId] = useState<string>("none");
  const [coverImage, setCoverImage] = useState<string>("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen");
      return;
    }
    setUploadingCover(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, {
        width: 480,
        height: 270,
        quality: 0.8,
      });
      setCoverImage(dataUrl);
    } catch {
      setError("No se pudo procesar la imagen");
    } finally {
      setUploadingCover(false);
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("type", type);
    if (platform) formData.set("platform", platform);
    formData.set(
      initialColumnField === "stage" ? "stage" : "status",
      initialColumnValue
    );
    formData.set("assigneeId", assigneeId === "none" ? "" : assigneeId);
    formData.set("projectId", projectId === "none" ? "" : projectId);
    formData.set("priority", priority);
    if (coverImage) formData.set("coverImage", coverImage);

    startTransition(async () => {
      const result = await createTask(formData);
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
        <DialogTitle>
          {isSkoolUpdate ? "Nueva actualización" : isContent ? "Nuevo video" : "Nueva tarea"}
        </DialogTitle>
        <DialogDescription>
          {isSkoolUpdate
            ? "Registra una actualización pendiente para una clase"
            : isContent
              ? "Añade una pieza de contenido al tablero"
              : "Añade una tarea de soporte"}
        </DialogDescription>

        <form action={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required autoFocus className="mt-1.5" />
          </div>

          {isContent && !isSkoolUpdate && (
            <div>
              <Label className="mb-1.5 block">Portada</Label>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--panel-strong)]">
                {coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[var(--ink-3)]">
                    Sin portada
                  </div>
                )}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  {coverImage && (
                    <button
                      type="button"
                      onClick={() => setCoverImage("")}
                      className="focus-ring flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur hover:bg-black/80"
                      aria-label="Quitar portada"
                      title="Quitar portada"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="focus-ring flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg"
                    aria-label="Subir portada"
                  >
                    {uploadingCover ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dueDate">
                {isContent ? "Fecha de publicación" : "Fecha límite"}
              </Label>
              <Input id="dueDate" name="dueDate" type="date" className="mt-1.5" />
              <p className="mt-1 text-[11px] text-[var(--ink-3)]">
                Déjalo vacío para &ldquo;Sin asignar&rdquo;
              </p>
            </div>
            <div>
              <Label htmlFor="driveLink">
                {isSkoolUpdate ? "Link de la clase" : "Enlace de Drive"}
              </Label>
              <Input
                id="driveLink"
                name="driveLink"
                type="url"
                placeholder={
                  isSkoolUpdate
                    ? "https://www.skool.com/…"
                    : "https://drive.google.com/…"
                }
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Responsable</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name ?? m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isContent && projects && projects.length > 0 && (
            <div>
              <Label>Proyecto</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Sin proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" rows={3} className="mt-1.5" />
            {isSkoolUpdate && (
              <p className="mt-1 text-[11px] text-[var(--ink-3)]">
                Podrás adjuntar capturas y documentos una vez creada.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSkoolUpdate ? "Crear actualización" : isContent ? "Crear video" : "Crear tarea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
