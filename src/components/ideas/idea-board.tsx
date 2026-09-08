"use client";

import { BoardCanvas, type BoardEdgeItem, type BoardItem } from "@/components/ideas/board-canvas";
import {
  createIdeaAt,
  createIdeaConnection,
  deleteIdea,
  deleteIdeaConnection,
  moveIdea,
  recolorIdea,
  resizeIdea,
  updateIdeaBody,
} from "@/app/actions/ideas";
import type { IdeaWithNodes } from "@/lib/data";
import type { BoardElementKind } from "@prisma/client";

type IdeaLike = {
  id: string;
  body: string;
  color: string;
  kind: BoardElementKind;
  x: number;
  y: number;
  width: number;
  height: number;
  createdById: string;
  createdBy: { name: string | null };
};

function ideaToItem(idea: IdeaLike): BoardItem {
  return {
    id: idea.id,
    kind: idea.kind,
    body: idea.body,
    color: idea.color,
    x: idea.x,
    y: idea.y,
    width: idea.width,
    height: idea.height,
    createdById: idea.createdById,
    authorName: idea.createdBy.name,
  };
}

export function IdeaBoard({
  ideas,
  connections,
  currentUserId,
  isAdmin,
  onOpenIdea,
}: {
  ideas: IdeaWithNodes[];
  connections: BoardEdgeItem[];
  currentUserId: string;
  isAdmin: boolean;
  onOpenIdea: (id: string) => void;
}) {
  return (
    <div className="h-[70vh] w-full">
      <BoardCanvas
        items={ideas.map(ideaToItem)}
        edges={connections}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onOpen={onOpenIdea}
        onCreate={async (kind, x, y) => {
          const result = await createIdeaAt(x, y, kind);
          return result?.idea ? ideaToItem(result.idea) : null;
        }}
        onEdit={(id, body) => void updateIdeaBody(id, body)}
        onRecolor={(id, color) => void recolorIdea(id, color)}
        onMove={(id, x, y) => void moveIdea(id, x, y)}
        onResize={(id, width, height) => void resizeIdea(id, width, height)}
        onDelete={(id) => void deleteIdea(id)}
        onConnect={async (sourceId, targetId) => {
          const result = await createIdeaConnection(sourceId, targetId);
          return result?.connection
            ? {
                id: result.connection.id,
                sourceId: result.connection.sourceId,
                targetId: result.connection.targetId,
              }
            : null;
        }}
        onDeleteEdge={(id) => void deleteIdeaConnection(id)}
      />
    </div>
  );
}
