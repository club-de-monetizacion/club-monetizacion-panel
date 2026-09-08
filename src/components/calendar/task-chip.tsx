import { PLATFORM_INFO, PRIORITY_INFO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PlatformIcon } from "@/components/ui/platform-icon";
import type { TaskWithRelations } from "@/lib/data";

export function TaskChip({
  task,
  onClick,
}: {
  task: TaskWithRelations;
  onClick: () => void;
}) {
  const color =
    task.type === "CONTENIDO" && task.platform
      ? PLATFORM_INFO[task.platform].color
      : PRIORITY_INFO[task.priority].color;

  const isDone = task.status === "COMPLETADA";

  return (
    <button
      type="button"
      onClick={onClick}
      title={task.title}
      className={cn(
        "focus-ring flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] font-medium transition hover:brightness-125",
        isDone && "opacity-50 line-through"
      )}
      style={{ backgroundColor: `${color}22`, color }}
    >
      {task.type === "CONTENIDO" && task.platform && (
        <PlatformIcon platform={task.platform} className="h-3 w-3 shrink-0" />
      )}
      <span className="truncate">{task.title}</span>
    </button>
  );
}
