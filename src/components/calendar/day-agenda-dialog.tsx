import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TaskChip } from "@/components/calendar/task-chip";
import type { TaskWithRelations } from "@/lib/data";

export function DayAgendaDialog({
  label,
  tasks,
  onClose,
  onSelectTask,
}: {
  label: string;
  tasks: TaskWithRelations[];
  onClose: () => void;
  onSelectTask: (task: TaskWithRelations) => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogTitle className="capitalize">{label}</DialogTitle>
        <DialogDescription>
          {tasks.length} tarea{tasks.length === 1 ? "" : "s"} programada
          {tasks.length === 1 ? "" : "s"}
        </DialogDescription>
        <div className="mt-4 max-h-80 space-y-1.5 overflow-y-auto">
          {tasks.map((task) => (
            <TaskChip key={task.id} task={task} onClick={() => onSelectTask(task)} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
