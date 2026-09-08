"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, MoreVertical, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PLATFORM_INFO } from "@/lib/constants";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { toggleArchiveProject, deleteProject } from "@/app/actions/projects";
import type { Platform } from "@prisma/client";

export function ProjectCard({
  project,
}: {
  project: {
    id: string;
    name: string;
    description: string | null;
    platform: Platform;
    driveLink: string | null;
    color: string;
    archived: boolean;
    createdBy: { name: string | null };
    _count: { tasks: number };
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const info = PLATFORM_INFO[project.platform];

  return (
    <div
      className="glass-panel rounded-2xl p-4 transition hover:border-[var(--panel-strong)]"
      style={{ opacity: project.archived ? 0.55 : 1 }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: project.color }} />
          <h3 className="text-sm font-semibold text-[var(--ink-0)]">{project.name}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="focus-ring rounded-md p-1 text-[var(--ink-3)] hover:bg-[var(--panel)]">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={isPending}
              onSelect={() =>
                startTransition(async () => {
                  await toggleArchiveProject(project.id, !project.archived);
                  router.refresh();
                })
              }
            >
              {project.archived ? (
                <ArchiveRestore className="h-3.5 w-3.5" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}
              {project.archived ? "Restaurar" : "Archivar"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-400"
              onSelect={(e) => {
                e.preventDefault();
                setConfirming(true);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mb-3 text-xs text-[var(--ink-2)]">
        {project.description || "Sin descripción"}
      </p>

      <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)]">
        <Link
          href={`/tableros/${project.platform.toLowerCase()}`}
          className="rounded-full px-2 py-0.5"
          style={{ background: `${info.color}22`, color: info.color }}
        >
          <PlatformIcon platform={project.platform} className="inline-block h-3 w-3 align-[-1px]" />{" "}
          {info.label}
        </Link>
        <span>{project._count.tasks} tareas</span>
      </div>

      {project.driveLink && (
        <a
          href={project.driveLink}
          target="_blank"
          rel="noreferrer"
          className="focus-ring mt-3 flex items-center gap-1.5 rounded-lg bg-[var(--panel-strong)] px-2.5 py-1.5 text-xs text-[var(--ink-1)] hover:text-[var(--accent)]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Material en Drive
        </a>
      )}

      {confirming && (
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-[var(--panel-border)] pt-3">
          <span className="text-xs text-[var(--ink-2)]">¿Eliminar proyecto?</span>
          <button
            className="text-xs text-[var(--ink-3)]"
            onClick={() => setConfirming(false)}
          >
            Cancelar
          </button>
          <button
            className="text-xs font-medium text-red-400"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await deleteProject(project.id);
                router.refresh();
              })
            }
          >
            Confirmar
          </button>
        </div>
      )}
    </div>
  );
}
