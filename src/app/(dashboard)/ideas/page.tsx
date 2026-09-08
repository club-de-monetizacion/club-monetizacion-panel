import { auth } from "@/auth";
import { getIdeas } from "@/lib/data";
import { NotesPanel } from "@/components/ideas/notes-panel";
import { IdeaBoard } from "@/components/ideas/idea-board";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

      <Tabs defaultValue="notas">
        <TabsList>
          <TabsTrigger value="notas">Notas</TabsTrigger>
          <TabsTrigger value="pizarra">Pizarra</TabsTrigger>
        </TabsList>

        <TabsContent value="notas" className="mt-5">
          <NotesPanel ideas={ideas} currentUserId={currentUserId} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="pizarra" className="mt-5">
          <IdeaBoard ideas={ideas} currentUserId={currentUserId} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
