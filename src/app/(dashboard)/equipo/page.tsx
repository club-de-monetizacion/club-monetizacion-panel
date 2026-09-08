import { auth } from "@/auth";
import {
  getAssignableMembers,
  getIdeas,
  getMyPendingTasks,
  getProjects,
  getTeamMembers,
} from "@/lib/data";
import { TeamMemberRow } from "@/components/team/team-member-row";
import { MyTasksPanel } from "@/components/team/my-tasks-panel";
import { IdeasPanel } from "@/components/team/ideas-panel";

export default async function TeamPage() {
  const session = await auth();
  const [members, myTasks, assignableMembers, projects, ideas] = await Promise.all([
    getTeamMembers(),
    session?.user.id ? getMyPendingTasks(session.user.id) : Promise.resolve([]),
    getAssignableMembers(),
    getProjects(),
    getIdeas(),
  ]);
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--ink-0)]">Equipo</h2>
        <p className="text-xs text-[var(--ink-3)]">
          {members.length} persona{members.length === 1 ? "" : "s"} con acceso al panel.
          {isAdmin && " Puedes cambiar el rol de cada miembro."}
        </p>
      </div>

      <MyTasksPanel tasks={myTasks} members={assignableMembers} projects={projects} />

      {session?.user.id && (
        <IdeasPanel ideas={ideas} currentUserId={session.user.id} isAdmin={isAdmin} />
      )}

      <div className="space-y-2.5">
        {members.map((member) => (
          <TeamMemberRow
            key={member.id}
            member={member}
            canManage={isAdmin && member.id !== session?.user.id}
          />
        ))}
      </div>
    </div>
  );
}
