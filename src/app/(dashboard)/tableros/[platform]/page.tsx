import { notFound } from "next/navigation";
import Link from "next/link";
import { Link2 } from "lucide-react";
import {
  getContentTasks,
  getPublishedTasks,
  getProjectsByPlatform,
  getAssignableMembers,
} from "@/lib/data";
import {
  CONTENT_STAGE_ACTIVE_ORDER,
  CONTENT_STAGE_INFO,
  PLATFORM_INFO,
} from "@/lib/constants";
import { KanbanBoard } from "@/components/board/kanban-board";
import { BoardToolbar } from "@/components/board/board-toolbar";
import type { Platform } from "@prisma/client";

const SLUGS = ["skool", "youtube", "tiktok", "instagram", "facebook"] as const;

export default async function PlatformBoardPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform: slug } = await params;
  if (!SLUGS.includes(slug as (typeof SLUGS)[number])) notFound();

  const platform = slug.toUpperCase() as Platform;
  const info = PLATFORM_INFO[platform];

  const [tasks, published, projects, members] = await Promise.all([
    getContentTasks(platform),
    getPublishedTasks(platform),
    getProjectsByPlatform(platform),
    getAssignableMembers(),
  ]);

  const columns = CONTENT_STAGE_ACTIVE_ORDER.map((stage) => ({
    key: stage,
    label: CONTENT_STAGE_INFO[stage].label,
    processing: CONTENT_STAGE_INFO[stage].processing,
  }));

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
            style={{ background: `${info.color}22` }}
          >
            {info.emoji}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink-0)]">{info.label}</h2>
            <p className="text-xs text-[var(--ink-3)]">
              {projects.length} proyecto{projects.length === 1 ? "" : "s"} activo
              {projects.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <BoardToolbar platform={platform} />
      </div>

      {projects.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href="/proyectos"
              className="glass-panel flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-[var(--ink-1)] transition hover:bg-[var(--panel-strong)]"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: p.color }}
              />
              {p.name}
              {p.driveLink && <Link2 className="h-3 w-3 text-[var(--ink-3)]" />}
            </Link>
          ))}
        </div>
      )}

      <KanbanBoard
        columns={columns}
        groupField="stage"
        initialTasks={tasks}
        archivedTasks={published}
        archivedLabel="Publicados"
        members={members}
        type="CONTENIDO"
        platform={platform}
        projects={projects}
      />
    </div>
  );
}
