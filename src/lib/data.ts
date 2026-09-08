import { prisma } from "@/lib/prisma";
import type { Platform } from "@prisma/client";

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
};

export type TaskWithRelations = Awaited<ReturnType<typeof getContentTasks>>[number];

export function getContentTasks(platform: Platform) {
  return prisma.task.findMany({
    where: { type: "CONTENIDO", platform },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
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
      where: { assigneeId: userId, status: { not: "COMPLETADA" } },
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
