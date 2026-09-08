"use client";

import { StickyBoard, type StickyItem } from "@/components/ideas/sticky-board";
import { createIdeaAt, deleteIdea, moveIdea, recolorIdea, updateIdeaBody } from "@/app/actions/ideas";
import type { IdeaWithNodes } from "@/lib/data";

type IdeaLike = {
  id: string;
  body: string;
  color: string;
  x: number;
  y: number;
  createdById: string;
  createdBy: { name: string | null };
};

function ideaToItem(idea: IdeaLike): StickyItem {
  return {
    id: idea.id,
    body: idea.body,
    color: idea.color,
    x: idea.x,
    y: idea.y,
    createdById: idea.createdById,
    authorName: idea.createdBy.name,
  };
}

export function IdeaBoard({
  ideas,
  currentUserId,
  isAdmin,
  onOpenIdea,
}: {
  ideas: IdeaWithNodes[];
  currentUserId: string;
  isAdmin: boolean;
  onOpenIdea: (id: string) => void;
}) {
  return (
    <div className="h-[70vh] w-full">
      <StickyBoard
        items={ideas.map(ideaToItem)}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        addLabel="Nueva idea"
        onOpen={onOpenIdea}
        onCreate={async (x, y) => {
          const result = await createIdeaAt("Nueva idea", x, y);
          return result?.idea ? ideaToItem(result.idea) : null;
        }}
        onEdit={(id, body) => void updateIdeaBody(id, body)}
        onRecolor={(id, color) => void recolorIdea(id, color)}
        onMove={(id, x, y) => void moveIdea(id, x, y)}
        onDelete={(id) => void deleteIdea(id)}
      />
    </div>
  );
}
