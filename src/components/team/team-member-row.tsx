"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRole } from "@/app/actions/team";
import { ROLE_INFO } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Role } from "@prisma/client";

export function TeamMemberRow({
  member,
  canManage,
}: {
  member: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: Role;
    bio: string | null;
    createdAt: Date;
  };
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="glass-panel flex flex-wrap items-center gap-3 rounded-xl p-3.5">
      <Avatar src={member.image} name={member.name} email={member.email} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--ink-0)]">
          {member.name ?? "Sin nombre"}
        </p>
        <p className="truncate text-xs text-[var(--ink-3)]">{member.email}</p>
        {member.bio && (
          <p className="mt-0.5 truncate text-xs text-[var(--ink-2)]">{member.bio}</p>
        )}
      </div>
      <span className="hidden text-[11px] text-[var(--ink-3)] sm:inline">
        Desde {formatDate(member.createdAt)}
      </span>

      {canManage ? (
        <div className="flex items-center gap-2">
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--ink-3)]" />}
          <Select
            defaultValue={member.role}
            onValueChange={(v) =>
              startTransition(async () => {
                await updateUserRole(member.id, v);
                router.refresh();
              })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_INFO).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  {info.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <span className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 text-xs text-[var(--ink-1)]">
          {ROLE_INFO[member.role].label}
        </span>
      )}
    </div>
  );
}
