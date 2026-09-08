"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Link2, Loader2, Trash2, Send, X } from "lucide-react";
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
import { ProcessingBadge } from "@/components/board/processing-badge";
import { AttachmentsSection } from "@/components/board/attachments-section";
import { ChecklistSection } from "@/components/board/checklist-section";
import { updateTask, deleteTask, addComment } from "@/app/actions/tasks";
import { CONTENT_STAGE_INFO, CONTENT_STAGE_ORDER, PRIORITY_INFO } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { fileToCompressedDataUrl } from "@/lib/image";
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
  const isContent = task.type === "CONTENIDO";
  const isSkoolUpdate = task.platform === "SKOOL_UPDATES";
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [notes, setNotes] = useState(task.notes ?? "");
  const [driveLink, setDriveLink] = useState(task.driveLink ?? "");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""
  );
  const [coverPreview, setCoverPreview] = useState(task.coverImage ?? "");
  const [uploadingCover, setUploadingCover] = useState(false);
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

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFieldError("Selecciona un archivo de imagen");
      return;
    }
    setUploadingCover(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, {
        width: 480,
        height: 270,
        quality: 0.8,
      });
      setCoverPreview(dataUrl);
      saveField("coverImage", dataUrl);
    } catch {
      setFieldError("No se pudo procesar la imagen");
    } finally {
      setUploadingCover(false);
    }
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

        {isContent && !isSkoolUpdate && (
          <div className="mt-3">
            <Label className="mb-1.5 block">Portada</Label>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--panel-strong)]">
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverPreview}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-[var(--ink-3)]">
                  Sin portada
                </div>
              )}
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                {coverPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverPreview("");
                      saveField("coverImage", "");
                    }}
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
                  aria-label="Cambiar portada"
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

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="dueDate">
              {isContent ? "Fecha de publicación" : "Fecha límite"}
            </Label>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  saveField("dueDate", e.target.value);
                }}
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => {
                    setDueDate("");
                    saveField("dueDate", "");
                  }}
                  className="focus-ring shrink-0 rounded-md p-2 text-[var(--ink-3)] hover:bg-[var(--panel)] hover:text-[var(--ink-0)]"
                  aria-label="Quitar fecha"
                  title="Sin asignar"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {!dueDate && (
              <p className="mt-1 text-[11px] text-[var(--ink-3)]">Sin asignar</p>
            )}
          </div>
          <div>
            <Label htmlFor="driveLink">
              {isSkoolUpdate ? "Link de la clase" : "Enlace de Drive"}
            </Label>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Input
                id="driveLink"
                type="url"
                value={driveLink}
                placeholder={
                  isSkoolUpdate
                    ? "https://www.skool.com/…"
                    : "https://drive.google.com/…"
                }
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

        <div className="mt-3 grid grid-cols-2 gap-3">
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

        <div className="mt-3 grid grid-cols-2 gap-3">
          {projects && projects.length > 0 && (
            <div>
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
          {isContent && (
            <div>
              <Label className="mb-1.5 flex items-center gap-1.5">
                Etapa
                {task.stage && CONTENT_STAGE_INFO[task.stage].processing && (
                  <ProcessingBadge compact />
                )}
              </Label>
              <Select
                defaultValue={task.stage ?? "IDEA"}
                onValueChange={(v) => saveField("stage", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_STAGE_ORDER.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {CONTENT_STAGE_INFO[stage].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isContent && (
          <div className="mt-3">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              rows={3}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => saveField("notes", notes)}
              className="mt-1.5"
              placeholder="Indicaciones o avisos adicionales para este video…"
            />
          </div>
        )}

        {isSkoolUpdate && (
          <AttachmentsSection taskId={task.id} attachments={task.attachments} />
        )}

        {isContent && (
          <ChecklistSection taskId={task.id} items={task.checklistItems} />
        )}

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
