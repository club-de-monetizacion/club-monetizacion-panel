import { prisma } from "@/lib/prisma";
import type { Platform } from "@prisma/client";

export function getCannedResponses() {
  return prisma.cannedResponse.findMany({
    orderBy: { createdAt: "asc" },
    include: { createdBy: { select: { id: true, name: true } } },
  });
}

export function getQuickLinks() {
  return prisma.quickLink.findMany({
    orderBy: { createdAt: "asc" },
    include: { createdBy: { select: { id: true, name: true } } },
  });
}

export function getIdeas() {
  return prisma.idea.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { id: true, name: true, image: true } } },
  });
}

export function getTeamMembers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      bio: true,
      createdAt: true,
    },
  });
}

export function getAssignableMembers() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, image: true, role: true },
  });
}

export function getProjects(includeArchived = false) {
  return prisma.project.findMany({
    where: includeArchived ? {} : { archived: false },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      _count: { select: { tasks: true } },
    },
  });
}

export function getProjectsByPlatform(platform: Platform) {
  return prisma.project.findMany({
    where: { platform, archived: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, driveLink: true, color: true },
  });
}

const taskInclude = {
  assignee: {
    select: { id: true, name: true, email: true, image: true },
  },
  project: {
    select: { id: true, name: true, driveLink: true, color: true, platform: true },
  },
  createdBy: { select: { id: true, name: true } },
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: { author: { select: { id: true, name: true, image: true } } },
  },
  attachments: {
    orderBy: { createdAt: "asc" as const },
  },
};

export type TaskWithRelations = Awaited<ReturnType<typeof getContentTasks>>[number];

export function getContentTasks(platform: Platform) {
  return prisma.task.findMany({
    where: { type: "CONTENIDO", platform, stage: { not: "PUBLICADO" } },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: taskInclude,
  });
}

/** Published videos, kept out of the active board to stay clean. */
export function getPublishedTasks(platform: Platform) {
  return prisma.task.findMany({
    where: { type: "CONTENIDO", platform, stage: "PUBLICADO" },
    orderBy: [{ dueDate: "desc" }, { updatedAt: "desc" }],
    include: taskInclude,
  });
}

export function getSupportTasks() {
  return prisma.task.findMany({
    where: { type: "SOPORTE" },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: taskInclude,
  });
}

export function getTasksInRange(start: Date, end: Date, assigneeId?: string) {
  return prisma.task.findMany({
    where: {
      dueDate: { gte: start, lte: end },
      ...(assigneeId ? { assigneeId } : {}),
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    include: taskInclude,
  });
}

/** Every task assigned to a user that isn't finished yet (completed
 * support tickets and published videos are excluded), regardless of type
 * or platform. */
export function getMyPendingTasks(userId: string) {
  return prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { not: "COMPLETADA" },
      stage: { not: "PUBLICADO" },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: 30,
    include: taskInclude,
  });
}

export async function getPlatformSummary() {
  const [taskCounts, projectCounts] = await Promise.all([
    prisma.task.groupBy({
      by: ["platform"],
      where: { type: "CONTENIDO" },
      _count: true,
    }),
    prisma.project.groupBy({
      by: ["platform"],
      where: { archived: false },
      _count: true,
    }),
  ]);
  return { taskCounts, projectCounts };
}

export async function getDashboardData(userId: string) {
  const [
    myTasks,
    contentCounts,
    supportCounts,
    upcoming,
    recentProjects,
    totalMembers,
  ] = await Promise.all([
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: "COMPLETADA" },
        stage: { not: "PUBLICADO" },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 6,
      include: taskInclude,
    }),
    prisma.task.groupBy({
      by: ["platform", "stage"],
      where: { type: "CONTENIDO" },
      _count: true,
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { type: "SOPORTE" },
      _count: true,
    }),
    prisma.task.findMany({
      where: {
        status: { not: "COMPLETADA" },
        stage: { not: "PUBLICADO" },
        dueDate: { not: null },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
      include: taskInclude,
    }),
    prisma.project.findMany({
      where: { archived: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.user.count(),
  ]);

  return {
    myTasks,
    contentCounts,
    supportCounts,
    upcoming,
    recentProjects,
    totalMembers,
  };
}
