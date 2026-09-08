import type {
  BackgroundType,
  ContentStage,
  Platform,
  Priority,
  Role,
  TaskStatus,
} from "@prisma/client";

export const PLATFORM_INFO: Record<
  Platform,
  { label: string; color: string; emoji: string }
> = {
  SKOOL: { label: "Skool", color: "#3B82F6", emoji: "🎓" },
  SKOOL_UPDATES: { label: "Actualizaciones Skool", color: "#0EA5E9", emoji: "📢" },
  YOUTUBE: { label: "YouTube", color: "#EF4444", emoji: "▶️" },
  TIKTOK: { label: "TikTok", color: "#e2e8f0", emoji: "🎵" },
  INSTAGRAM: { label: "Instagram", color: "#EC4899", emoji: "📸" },
  FACEBOOK: { label: "Facebook", color: "#3B82F6", emoji: "👍" },
};

export const PLATFORM_ORDER: Platform[] = [
  "SKOOL",
  "SKOOL_UPDATES",
  "YOUTUBE",
  "TIKTOK",
  "INSTAGRAM",
  "FACEBOOK",
];

export const CONTENT_STAGE_INFO: Record<
  ContentStage,
  { label: string; processing?: boolean }
> = {
  IDEA: { label: "Idea" },
  PLANEADO: { label: "Planeado" },
  GRABADO: { label: "Grabado" },
  EDITANDO: { label: "Editando", processing: true },
  EDITADO: { label: "Editado" },
  PUBLICADO: { label: "Publicado" },
};

/** Columns shown on the working board — published videos are archived out of
 * the active pipeline to keep it clean; they're reachable via the archive
 * toggle and can still be re-opened from the task detail's stage selector. */
export const CONTENT_STAGE_ACTIVE_ORDER: ContentStage[] = [
  "IDEA",
  "PLANEADO",
  "GRABADO",
  "EDITANDO",
  "EDITADO",
];

export const CONTENT_STAGE_ORDER: ContentStage[] = [
  ...CONTENT_STAGE_ACTIVE_ORDER,
  "PUBLICADO",
];

export const TASK_STATUS_INFO: Record<TaskStatus, { label: string }> = {
  PENDIENTE: { label: "Pendiente" },
  EN_PROGRESO: { label: "En progreso" },
  EN_REVISION: { label: "En revisión" },
  COMPLETADA: { label: "Completada" },
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "PENDIENTE",
  "EN_PROGRESO",
  "EN_REVISION",
  "COMPLETADA",
];

export const PRIORITY_INFO: Record<
  Priority,
  { label: string; color: string }
> = {
  BAJA: { label: "Baja", color: "#64748b" },
  MEDIA: { label: "Media", color: "#3b82f6" },
  ALTA: { label: "Alta", color: "#f59e0b" },
  URGENTE: { label: "Urgente", color: "#ef4444" },
};

export const ROLE_INFO: Record<Role, { label: string }> = {
  ADMIN: { label: "Administrador" },
  SOPORTE: { label: "Soporte" },
  EDITOR: { label: "Editor" },
  MIEMBRO: { label: "Miembro" },
};

export const BACKGROUND_TYPE_INFO: Record<
  BackgroundType,
  { label: string; description: string }
> = {
  PARTICLES: {
    label: "Partículas",
    description: "Partículas animadas conectadas entre sí",
  },
  AURORA: {
    label: "Aurora",
    description: "Manchas de color difuminadas en movimiento",
  },
  GRADIENT: {
    label: "Degradado",
    description: "Degradado suave animado",
  },
  SOLID: {
    label: "Sólido",
    description: "Color de fondo plano",
  },
};

export const ACCENT_PRESETS = [
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

export const BACKGROUND_PRESETS = [
  "#0b0f19",
  "#0f172a",
  "#111827",
  "#18181b",
  "#1e1b4b",
  "#052e2b",
  "#f8fafc",
  "#ffffff",
];
