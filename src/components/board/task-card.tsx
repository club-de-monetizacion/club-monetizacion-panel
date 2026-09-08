"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Link2, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_INFO, PLATFORM_INFO } from "@/lib/constants";
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

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={onClick}
      className={cn(
        "glass-panel animate-fade-in group cursor-pointer rounded-xl p-3 shadow-sm transition hover:border-[var(--panel-strong)] hover:shadow-lg",
        isDragging && "opacity-40",
        overlay && "rotate-2 shadow-2xl"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-[var(--ink-0)]">
          {task.title}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge color={PRIORITY_INFO[task.priority].color}>
          {PRIORITY_INFO[task.priority].label}
        </Badge>
        {task.platform && (
          <Badge color={PLATFORM_INFO[task.platform].color}>
            {PLATFORM_INFO[task.platform].emoji} {PLATFORM_INFO[task.platform].label}
          </Badge>
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
  );
}
