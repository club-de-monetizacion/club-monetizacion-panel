"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2, Trash2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTask, deleteTask, addComment } from "@/app/actions/tasks";
import { PRIORITY_INFO } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/data";

type Member = { id: string; name: string | null; email: string; image?: string | null };
type ProjectOption = { id: string; name: string };

export function TaskDetailDialog({
  task,
  members,
  projects,
  onClose,
}: {
  task: TaskWithRelations;
  members: Member[];
  projects?: ProjectOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [driveLink, setDriveLink] = useState(task.driveLink ?? "");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [commentBody, setCommentBody] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  function saveField(field: string, value: string) {
    setFieldError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set(field, value);
      const result = await updateTask(task.id, fd);
      if (result?.error) {
        setFieldError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTask(task.id);
      router.refresh();
      onClose();
    });
  }

  function handleAddComment() {
    if (!commentBody.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("body", commentBody);
      await addComment(task.id, fd);
      setCommentBody("");
      router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="sr-only">Detalle de tarea</DialogTitle>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== task.title && saveField("title", title)}
          className="focus-ring w-full rounded-lg bg-transparent pr-8 text-lg font-semibold text-[var(--ink-0)] outline-none"
        />
        {fieldError && <p className="mt-1 text-xs text-red-400">{fieldError}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <Label>Responsable</Label>
            <Select
              defaultValue={task.assignee?.id ?? "none"}
              onValueChange={(v) => saveField("assigneeId", v === "none" ? "" : v)}
            >
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
            <Select
              defaultValue={task.priority}
              onValueChange={(v) => saveField("priority", v)}
            >
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

        {projects && projects.length > 0 && (
          <div className="mt-3">
            <Label>Proyecto</Label>
            <Select
              defaultValue={task.project?.id ?? "none"}
              onValueChange={(v) => saveField("projectId", v === "none" ? "" : v)}
            >
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

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="dueDate">Fecha límite</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                saveField("dueDate", e.target.value);
              }}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="driveLink">Enlace de Drive</Label>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Input
                id="driveLink"
                type="url"
                value={driveLink}
                placeholder="https://drive.google.com/…"
                onChange={(e) => setDriveLink(e.target.value)}
                onBlur={() => saveField("driveLink", driveLink)}
              />
              {task.driveLink && (
                <a
                  href={task.driveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring rounded-md p-2 text-[var(--ink-2)] hover:bg-[var(--panel)] hover:text-[var(--accent)]"
                >
                  <Link2 className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={description}
            rows={4}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => saveField("description", description)}
            className="mt-1.5"
            placeholder="Añade detalles, instrucciones o contexto…"
          />
        </div>

        <div className="mt-5 border-t border-[var(--panel-border)] pt-4">
          <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-3)]">
            Comentarios
          </p>
          <div className="max-h-40 space-y-3 overflow-y-auto pr-1">
            {task.comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <Avatar src={c.author.image} name={c.author.name} size={26} />
                <div>
                  <p className="text-xs font-medium text-[var(--ink-1)]">
                    {c.author.name}{" "}
                    <span className="font-normal text-[var(--ink-3)]">
                      {formatDate(c.createdAt)}
                    </span>
                  </p>
                  <p className="text-sm text-[var(--ink-1)]">{c.body}</p>
                </div>
              </div>
            ))}
            {task.comments.length === 0 && (
              <p className="text-xs text-[var(--ink-3)]">Aún no hay comentarios.</p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Escribe un comentario…"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={handleAddComment}
              disabled={isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[var(--panel-border)] pt-4">
          <span className="text-[11px] text-[var(--ink-3)]">
            Creada por {task.createdBy?.name} · {formatDate(task.createdAt)}
          </span>
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--ink-2)]">¿Eliminar tarea?</span>
              <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Cancelar
              </Button>
              <Button size="sm" variant="danger" onClick={handleDelete} disabled={isPending}>
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirmar
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(true)}>
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
