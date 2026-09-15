"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, ListChecks, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  createDailyTaskItem,
  deleteDailyTaskItem,
  toggleDailyTaskToday,
  updateDailyTaskItem,
} from "@/app/actions/daily-tasks";
import {
  WEEKDAY_DISPLAY_ORDER,
  WEEKDAY_LABELS,
  isItemActiveOnDate,
  recurrenceLabel,
} from "@/lib/daily-task-recurrence";
import { DailyTasksCalendar } from "@/components/support/daily-tasks-calendar";
import { cn } from "@/lib/utils";
import { todayInAppZone } from "@/lib/timezone";
import type { DailyTaskWithTodayLog } from "@/lib/data";
import type { TaskCategory, TaskRecurrence } from "@prisma/client";

function todayUTCDateInput() {
  return todayInAppZone().toISOString().slice(0, 10);
}

function dateInputValue(onDate: Date | string | null) {
  if (!onDate) return todayUTCDateInput();
  return new Date(onDate).toISOString().slice(0, 10);
}

type RecurrenceState = {
  recurrence: TaskRecurrence;
  setRecurrence: (r: TaskRecurrence) => void;
  weekdays: number[];
  toggleWeekday: (day: number) => void;
  onDate: string;
  setOnDate: (d: string) => void;
};

function RecurrenceFields({ recurrence, setRecurrence, weekdays, toggleWeekday, onDate, setOnDate }: RecurrenceState) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            ["DAILY", "Diario"],
            ["ONCE", "Solo un día"],
            ["WEEKLY", "Días de la semana"],
          ] as [TaskRecurrence, string][]
        ).map(([value, text]) => (
          <button
            key={value}
            type="button"
            onClick={() => setRecurrence(value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition",
              recurrence === value
                ? "bg-[var(--accent-soft)] text-[var(--ink-0)]"
                : "bg-[var(--panel-strong)] text-[var(--ink-2)] hover:text-[var(--ink-0)]"
            )}
          >
            {text}
          </button>
        ))}
      </div>

      {recurrence === "ONCE" && (
        <input
          type="date"
          value={onDate}
          onChange={(e) => setOnDate(e.target.value)}
          className="focus-ring w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-1.5 text-sm text-[var(--ink-1)] outline-none"
        />
      )}

      {recurrence === "WEEKLY" && (
        <div className="flex flex-wrap gap-1">
          {WEEKDAY_DISPLAY_ORDER.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleWeekday(day)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition",
                weekdays.includes(day)
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--panel-strong)] text-[var(--ink-2)] hover:text-[var(--ink-0)]"
              )}
            >
              {WEEKDAY_LABELS[day]}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function TaskRow({
  item,
  showCheckbox,
  onToggle,
  onDelete,
  onSave,
}: {
  item: DailyTaskWithTodayLog;
  showCheckbox: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSave: (data: { label: string; recurrence: TaskRecurrence; weekdays: number[]; onDate: string | null }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [recurrence, setRecurrence] = useState<TaskRecurrence>(item.recurrence);
  const [weekdays, setWeekdays] = useState<number[]>(item.weekdays);
  const [onDate, setOnDate] = useState(dateInputValue(item.onDate));

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function startEditing() {
    setLabel(item.label);
    setRecurrence(item.recurrence);
    setWeekdays(item.weekdays);
    setOnDate(dateInputValue(item.onDate));
    setEditing(true);
  }

  function handleSave() {
    const trimmed = label.trim();
    if (!trimmed) return;
    if (recurrence === "WEEKLY" && weekdays.length === 0) return;
    onSave({ label: trimmed, recurrence, weekdays, onDate: recurrence === "ONCE" ? onDate : null });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-lg bg-[var(--panel)] px-2.5 py-2.5">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
        <RecurrenceFields
          recurrence={recurrence}
          setRecurrence={setRecurrence}
          weekdays={weekdays}
          toggleWeekday={toggleWeekday}
          onDate={onDate}
          setOnDate={setOnDate}
        />
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={!label.trim() || (recurrence === "WEEKLY" && weekdays.length === 0)}
            className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[var(--accent)] py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="focus-ring flex items-center justify-center gap-1.5 rounded-md bg-[var(--panel-strong)] px-3 py-1.5 text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink-0)]"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  const isDone = item.logs.length > 0;

  return (
    <div className="group flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-[var(--panel)]">
      {showCheckbox && (
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "focus-ring flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
            isDone
              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
              : "border-[var(--panel-border)] text-transparent hover:border-[var(--accent)]"
          )}
          aria-label={isDone ? "Marcar como pendiente" : "Marcar como cumplida"}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          showCheckbox && isDone ? "text-[var(--ink-3)] line-through" : "text-[var(--ink-1)]"
        )}
      >
        {item.label}
      </span>
      <span className="shrink-0 text-[10px] text-[var(--ink-3)]">{recurrenceLabel(item)}</span>
      <button
        type="button"
        onClick={startEditing}
        className="focus-ring shrink-0 rounded-md p-1 text-[var(--ink-3)] opacity-0 hover:text-[var(--ink-0)] group-hover:opacity-100"
        aria-label={`Editar "${item.label}"`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="focus-ring shrink-0 rounded-md p-1 text-[var(--ink-3)] opacity-0 hover:text-red-400 group-hover:opacity-100"
        aria-label={`Eliminar "${item.label}"`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function DailyTasksPanel({
  items,
  userId,
  category,
}: {
  items: DailyTaskWithTodayLog[];
  userId: string;
  category: TaskCategory;
}) {
  const router = useRouter();
  const today = todayInAppZone();
  const [view, setView] = useState<"hoy" | "historial">("hoy");
  const [label, setLabel] = useState("");
  const [recurrence, setRecurrence] = useState<TaskRecurrence>("DAILY");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [onDate, setOnDate] = useState(todayUTCDateInput());
  const [isPending, startTransition] = useTransition();

  const todayItems = items.filter((item) => isItemActiveOnDate(item, today));
  const otherItems = items.filter((item) => !isItemActiveOnDate(item, today));

  const total = todayItems.length;
  const done = todayItems.filter((item) => item.logs.length > 0).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function handleToggle(item: DailyTaskWithTodayLog) {
    const nextDone = item.logs.length === 0;
    startTransition(async () => {
      await toggleDailyTaskToday(item.id, nextDone);
      router.refresh();
    });
  }

  function handleAdd() {
    const trimmed = label.trim();
    if (!trimmed) return;
    if (recurrence === "WEEKLY" && weekdays.length === 0) return;
    startTransition(async () => {
      await createDailyTaskItem(trimmed, recurrence, weekdays, onDate, category, userId);
      setLabel("");
      setWeekdays([]);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteDailyTaskItem(id);
      router.refresh();
    });
  }

  function handleUpdate(
    id: string,
    data: { label: string; recurrence: TaskRecurrence; weekdays: number[]; onDate: string | null }
  ) {
    startTransition(async () => {
      await updateDailyTaskItem(id, data.label, data.recurrence, data.weekdays, data.onDate);
      router.refresh();
    });
  }

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex gap-1 rounded-lg bg-[var(--panel-strong)] p-1">
        <button
          type="button"
          onClick={() => setView("hoy")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition",
            view === "hoy" ? "bg-[var(--accent)] text-white" : "text-[var(--ink-2)] hover:text-[var(--ink-0)]"
          )}
        >
          <ListChecks className="h-3.5 w-3.5" />
          Hoy
        </button>
        <button
          type="button"
          onClick={() => setView("historial")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition",
            view === "historial" ? "bg-[var(--accent)] text-white" : "text-[var(--ink-2)] hover:text-[var(--ink-0)]"
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          Historial
        </button>
      </div>

      {view === "historial" ? (
        <DailyTasksCalendar userId={userId} category={category} />
      ) : (
        <>
          <div className="mb-5">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-[var(--ink-1)]">Progreso de hoy</span>
              <span className="text-[var(--ink-3)]">
                {done}/{total} · {pct}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--panel-strong)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            {todayItems.map((item) => (
              <TaskRow
                key={item.id}
                item={item}
                showCheckbox
                onToggle={() => handleToggle(item)}
                onDelete={() => handleDelete(item.id)}
                onSave={(data) => handleUpdate(item.id, data)}
              />
            ))}
            {todayItems.length === 0 && (
              <p className="px-2 py-3 text-sm text-[var(--ink-3)]">
                No hay tareas programadas para hoy.
              </p>
            )}
          </div>

          {otherItems.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wide text-[var(--ink-3)]">
                Programadas para otros días
              </p>
              <div className="space-y-1">
                {otherItems.map((item) => (
                  <TaskRow
                    key={item.id}
                    item={item}
                    showCheckbox={false}
                    onToggle={() => {}}
                    onDelete={() => handleDelete(item.id)}
                    onSave={(data) => handleUpdate(item.id, data)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2 border-t border-[var(--panel-border)] pt-4">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && recurrence !== "WEEKLY" && handleAdd()}
              placeholder="Agregar una tarea…"
            />

            <RecurrenceFields
              recurrence={recurrence}
              setRecurrence={setRecurrence}
              weekdays={weekdays}
              toggleWeekday={toggleWeekday}
              onDate={onDate}
              setOnDate={setOnDate}
            />

            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || !label.trim() || (recurrence === "WEEKLY" && weekdays.length === 0)}
              className="focus-ring flex w-full items-center justify-center gap-1.5 rounded-md bg-[var(--panel-strong)] py-2 text-sm font-medium text-[var(--ink-1)] hover:bg-[var(--panel)] disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Agregar tarea
            </button>
          </div>

          <p className="mt-3 text-[11px] text-[var(--ink-3)]">
            El progreso se reinicia cada día, pero cada tarea cumplida queda registrada.
          </p>
        </>
      )}
    </div>
  );
}
