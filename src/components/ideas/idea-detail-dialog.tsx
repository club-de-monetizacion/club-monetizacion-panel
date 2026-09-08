"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { BoardCanvas, type BoardItem } from "@/components/ideas/board-canvas";
import { updateIdeaBody } from "@/app/actions/ideas";
import {
  createIdeaNode,
  createIdeaNodeConnection,
  deleteIdeaNode,
  deleteIdeaNodeConnection,
  moveIdeaNode,
  recolorIdeaNode,
  resizeIdeaNode,
  updateIdeaNodeBody,
} from "@/app/actions/idea-nodes";
import type { IdeaWithNodes } from "@/lib/data";

function nodeToItem(node: IdeaWithNodes["nodes"][number]): BoardItem {
  return {
    id: node.id,
    kind: node.kind,
    body: node.body,
    color: node.color,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    createdById: node.createdById,
    authorName: node.createdBy.name,
  };
}

export function IdeaDetailDialog({
  idea,
  currentUserId,
  isAdmin,
  onClose,
}: {
  idea: IdeaWithNodes;
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(idea.body);
  const [, startTransition] = useTransition();

  function saveTitle() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(idea.body);
      return;
    }
    if (trimmed === idea.body) return;
    startTransition(() => {
      void updateIdeaBody(idea.id, trimmed);
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[85vh] w-[95vw] max-w-6xl flex-col gap-3 overflow-hidden">
        <DialogTitle className="sr-only">Desarrollar idea</DialogTitle>
        <div className="shrink-0 pr-8">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--ink-3)]">
            Idea
          </p>
          <Textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            rows={2}
            className="resize-none text-base font-medium"
            placeholder="Escribe la idea…"
          />
          <p className="mt-1 text-[11px] text-[var(--ink-3)]">
            De {idea.createdBy.name} · usa la pizarra de abajo para desarrollarla con más notas,
            textos, formas y flechas.
          </p>
        </div>
        <div className="min-h-0 flex-1">
          <BoardCanvas
            items={idea.nodes.map(nodeToItem)}
            edges={idea.nodeConnections.map((c) => ({
              id: c.id,
              sourceId: c.sourceId,
              targetId: c.targetId,
            }))}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onCreate={async (kind, x, y) => {
              const result = await createIdeaNode(idea.id, x, y, kind);
              return result?.node ? nodeToItem(result.node) : null;
            }}
            onEdit={(id, body) => void updateIdeaNodeBody(id, body)}
            onRecolor={(id, color) => void recolorIdeaNode(id, color)}
            onMove={(id, x, y) => void moveIdeaNode(id, x, y)}
            onResize={(id, width, height) => void resizeIdeaNode(id, width, height)}
            onDelete={(id) => void deleteIdeaNode(id)}
            onConnect={async (sourceId, targetId) => {
              const result = await createIdeaNodeConnection(idea.id, sourceId, targetId);
              return result?.connection
                ? {
                    id: result.connection.id,
                    sourceId: result.connection.sourceId,
                    targetId: result.connection.targetId,
                  }
                : null;
            }}
            onDeleteEdge={(id) => void deleteIdeaNodeConnection(id)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
