"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Link2, MessageSquare, Paperclip, StickyNote } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProcessingBadge } from "@/components/board/processing-badge";
import { CONTENT_STAGE_INFO, PRIORITY_INFO, PLATFORM_INFO } from "@/lib/constants";
import { formatDate, cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/data";

export function TaskCard({
  task,
  onClick,
  overlay,
}: {
  task: TaskWithRelations;
  onClick?: () => void;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: overlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "COMPLETADA";

  const isProcessing = task.stage ? CONTENT_STAGE_INFO[task.stage].processing : false;
  const platformInfo = task.platform ? PLATFORM_INFO[task.platform] : null;

  const wrapperProps = overlay
    ? {}
    : { ref: setNodeRef, style, ...attributes, ...listeners };

  return (
    <div
      {...wrapperProps}
      onClick={onClick}
      className={cn(
        "glass-panel animate-fade-in group cursor-pointer overflow-hidden rounded-xl shadow-sm transition hover:border-[var(--panel-strong)] hover:shadow-lg",
        isDragging && "opacity-40",
        overlay && "rotate-2 shadow-2xl",
        isProcessing && "ring-1 ring-[var(--accent)]/40"
      )}
    >
      {task.type === "CONTENIDO" && (
        <div className="relative aspect-video w-full bg-[var(--panel-strong)]">
          {task.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={task.coverImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-2xl"
              style={{
                background: platformInfo ? `${platformInfo.color}18` : undefined,
              }}
            >
              {platformInfo?.emoji}
            </div>
          )}
          {isProcessing && (
            <ProcessingBadge className="absolute left-1.5 top-1.5 backdrop-blur" />
          )}
        </div>
      )}

      <div className="p-3">
        <p className="mb-2 text-sm font-medium leading-snug text-[var(--ink-0)]">
          {task.title}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge color={PRIORITY_INFO[task.priority].color}>
            {PRIORITY_INFO[task.priority].label}
          </Badge>
          {task.type === "CONTENIDO" && !isProcessing && task.platform && (
            <Badge color={platformInfo!.color}>{platformInfo!.emoji}</Badge>
          )}
          {task.project && (
            <Badge className="bg-[var(--panel-strong)] text-[var(--ink-2)]">
              {task.project.name}
            </Badge>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--ink-3)]">
            {task.dueDate && (
              <span
                className={cn(
                  "flex items-center gap-1 text-[11px]",
                  isOverdue && "text-red-400"
                )}
              >
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
            {task.driveLink && <Link2 className="h-3 w-3" />}
            {task.notes && <StickyNote className="h-3 w-3" />}
            {task.attachments.length > 0 && (
              <span className="flex items-center gap-0.5 text-[11px]">
                <Paperclip className="h-3 w-3" />
                {task.attachments.length}
              </span>
            )}
            {task.comments.length > 0 && (
              <span className="flex items-center gap-1 text-[11px]">
                <MessageSquare className="h-3 w-3" />
                {task.comments.length}
              </span>
            )}
          </div>
          {task.assignee && (
            <Avatar
              src={task.assignee.image}
              name={task.assignee.name}
              email={task.assignee.email}
              size={22}
            />
          )}
        </div>
      </div>
    </div>
  );
}
