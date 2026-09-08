import { Calendar, Link2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_INFO, PRIORITY_INFO } from "@/lib/constants";
import { formatDate, cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/data";

export function MiniTaskRow({ task }: { task: TaskWithRelations }) {
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETADA";

  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-[var(--panel)]">
      {task.assignee ? (
        <Avatar src={task.assignee.image} name={task.assignee.name} size={28} />
      ) : (
        <div className="h-7 w-7 rounded-full bg-[var(--panel-strong)]" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--ink-0)]">{task.title}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          {task.platform && (
            <Badge color={PLATFORM_INFO[task.platform].color}>
              {PLATFORM_INFO[task.platform].emoji}
            </Badge>
          )}
          <Badge color={PRIORITY_INFO[task.priority].color}>
            {PRIORITY_INFO[task.priority].label}
          </Badge>
          {task.driveLink && <Link2 className="h-3 w-3 text-[var(--ink-3)]" />}
        </div>
      </div>
      {task.dueDate && (
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 text-[11px] text-[var(--ink-3)]",
            isOverdue && "text-red-400"
          )}
        >
          <Calendar className="h-3 w-3" />
          {formatDate(task.dueDate)}
        </span>
      )}
    </div>
  );
}
