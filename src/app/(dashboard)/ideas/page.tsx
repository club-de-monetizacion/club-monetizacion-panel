import { auth } from "@/auth";
import { getIdeas } from "@/lib/data";
import { IdeasClient } from "@/components/ideas/ideas-client";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const session = await auth();
  const ideas = await getIdeas();
  const isAdmin = session?.user.role === "ADMIN";
  const currentUserId = session?.user.id ?? "";

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--ink-0)]">💡 Ideas</h2>
        <p className="text-xs text-[var(--ink-3)]">
          Anota ideas rápidas o desarróllalas en la pizarra.
        </p>
      </div>

      <IdeasClient ideas={ideas} currentUserId={currentUserId} isAdmin={isAdmin} />
    </div>
  );
}
