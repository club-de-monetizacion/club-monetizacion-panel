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
import { createTask } from "@/app/actions/tasks";
import { PRIORITY_INFO } from "@/lib/constants";
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
  const [priority, setPriority] = useState("MEDIA");
  const [assigneeId, setAssigneeId] = useState<string>("none");
  const [projectId, setProjectId] = useState<string>("none");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
        <DialogTitle>Nueva tarea</DialogTitle>
        <DialogDescription>
          {type === "CONTENIDO"
            ? "Añade una pieza de contenido al tablero"
            : "Añade una tarea de soporte"}
        </DialogDescription>

        <form action={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required autoFocus className="mt-1.5" />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" rows={3} className="mt-1.5" />
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

          {type === "CONTENIDO" && projects && projects.length > 0 && (
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dueDate">Fecha límite</Label>
              <Input id="dueDate" name="dueDate" type="date" className="mt-1.5" />
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
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear tarea
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
