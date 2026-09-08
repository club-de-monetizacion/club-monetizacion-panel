"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotesPanel } from "@/components/ideas/notes-panel";
import { IdeaBoard } from "@/components/ideas/idea-board";
import { IdeaDetailDialog } from "@/components/ideas/idea-detail-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IdeaWithNodes } from "@/lib/data";

export function IdeasClient({
  ideas,
  currentUserId,
  isAdmin,
}: {
  ideas: IdeaWithNodes[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [openIdeaId, setOpenIdeaId] = useState<string | null>(null);

  // Resync against fresh server data (after a create/delete refresh) without
  // an effect: if the open idea disappeared from the list, close the dialog.
  const [prevIdeas, setPrevIdeas] = useState(ideas);
  if (prevIdeas !== ideas) {
    setPrevIdeas(ideas);
    if (openIdeaId && !ideas.some((idea) => idea.id === openIdeaId)) {
      setOpenIdeaId(null);
    }
  }

  const openIdea = ideas.find((idea) => idea.id === openIdeaId) ?? null;

  return (
    <>
      <Tabs defaultValue="notas">
        <TabsList>
          <TabsTrigger value="notas">Notas</TabsTrigger>
          <TabsTrigger value="pizarra">Pizarra</TabsTrigger>
        </TabsList>

        <TabsContent value="notas" className="mt-5">
          <NotesPanel
            ideas={ideas}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onOpenIdea={setOpenIdeaId}
          />
        </TabsContent>

        <TabsContent value="pizarra" className="mt-5">
          <IdeaBoard
            ideas={ideas}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onOpenIdea={setOpenIdeaId}
          />
        </TabsContent>
      </Tabs>

      {openIdea && (
        <IdeaDetailDialog
          key={openIdea.id}
          idea={openIdea}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onClose={() => {
            setOpenIdeaId(null);
            // Its own board persists optimistic edits without a refresh
            // (same as the top-level board), so refetch once it's closed
            // to keep the next open of any idea showing the latest data.
            router.refresh();
          }}
        />
      )}
    </>
  );
}
