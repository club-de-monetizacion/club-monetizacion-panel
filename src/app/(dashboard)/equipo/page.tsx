import { auth } from "@/auth";
import { getTeamMembers } from "@/lib/data";
import { TeamMemberRow } from "@/components/team/team-member-row";

export default async function TeamPage() {
  const session = await auth();
  const members = await getTeamMembers();
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
