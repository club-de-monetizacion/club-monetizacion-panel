"use client";

import "@xyflow/react/dist/style.css";
import { createContext, useCallback, useContext, useState, useTransition } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createIdeaAt, deleteIdea, moveIdea, recolorIdea, updateIdeaBody } from "@/app/actions/ideas";
import { cn } from "@/lib/utils";

export const STICKY_COLORS = [
  "#fef08a",
  "#fecaca",
  "#bfdbfe",
  "#bbf7d0",
  "#e9d5ff",
  "#fed7aa",
];

type IdeaRecord = {
  id: string;
  body: string;
  color: string;
  x: number;
  y: number;
  createdById: string;
  createdBy: { id: string; name: string | null; image: string | null };
};

type StickyData = {
  body: string;
  color: string;
  authorName: string | null;
  createdById: string;
};

function ideaToNode(idea: IdeaRecord): Node {
  return {
    id: idea.id,
    type: "sticky",
    position: { x: idea.x, y: idea.y },
    data: {
      body: idea.body,
      color: idea.color,
      authorName: idea.createdBy.name,
      createdById: idea.createdById,
    } satisfies StickyData,
  };
}

/** Sticky notes read shared edit/delete callbacks from context instead of
 * carrying them on each node's own data, so the handlers can be defined
 * once (after the nodes state exists) without needing to rebuild every
 * node's data whenever a handler identity would otherwise change. */
const BoardActionsContext = createContext<{
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (id: string, body: string) => void;
  onRecolor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
} | null>(null);

function StickyNoteNode({ id, data }: NodeProps) {
  const d = data as unknown as StickyData;
  const actions = useContext(BoardActionsContext);
  const [text, setText] = useState(d.body);
  const [confirming, setConfirming] = useState(false);
  if (!actions) return null;
  const canDelete = d.createdById === actions.currentUserId || actions.isAdmin;

  return (
    <div
      className="w-56 rounded-xl p-3 shadow-xl ring-1 ring-black/10"
      style={{ background: d.color }}
    >
      <textarea
        className="nodrag w-full resize-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const trimmed = text.trim();
          if (trimmed && trimmed !== d.body) actions.onEdit(id, trimmed);
          else if (!trimmed) setText(d.body);
        }}
        placeholder="Escribe la idea…"
      />
      <div className="mt-2 flex items-center justify-between">
        <div className="nodrag flex gap-1">
          {STICKY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => actions.onRecolor(id, c)}
              className={cn(
                "h-4 w-4 rounded-full ring-1 ring-black/15 transition hover:scale-110",
                d.color === c && "ring-2 ring-black/40"
              )}
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
        <div className="nodrag flex items-center gap-1.5">
          <span className="max-w-[5.5rem] truncate text-[10px] text-slate-600">
            {d.authorName}
          </span>
          {canDelete &&
            (confirming ? (
              <button
                type="button"
                onClick={() => actions.onDelete(id)}
                className="rounded p-0.5 text-[10px] font-medium text-red-700 hover:bg-black/10"
              >
                ¿Seguro?
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="rounded p-0.5 text-slate-600 hover:bg-black/10 hover:text-red-700"
                aria-label="Eliminar idea"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { sticky: StickyNoteNode };

export function IdeaBoard({
  ideas,
  currentUserId,
  isAdmin,
}: {
  ideas: IdeaRecord[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [nodes, setNodes] = useState<Node[]>(() => ideas.map(ideaToNode));

  const handleEdit = useCallback((id: string, body: string) => {
    void updateIdeaBody(id, body);
    setNodes((ns) =>
      ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, body } } : n))
    );
  }, []);

  const handleRecolor = useCallback((id: string, color: string) => {
    void recolorIdea(id, color);
    setNodes((ns) =>
      ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, color } } : n))
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    void deleteIdea(id);
    setNodes((ns) => ns.filter((n) => n.id !== id));
  }, []);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onNodeDragStop = useCallback((_event: unknown, node: Node) => {
    void moveIdea(node.id, node.position.x, node.position.y);
  }, []);

  function handleAdd() {
    startTransition(async () => {
      const count = nodes.length;
      const x = 60 + (count % 5) * 260 + Math.round(Math.random() * 30);
      const y = 60 + Math.floor(count / 5) * 200 + Math.round(Math.random() * 30);
      const result = await createIdeaAt("Nueva idea", x, y);
      if (result?.idea) {
        setNodes((ns) => [...ns, ideaToNode(result.idea)]);
      }
    });
  }

  return (
    <BoardActionsContext.Provider
      value={{
        currentUserId,
        isAdmin,
        onEdit: handleEdit,
        onRecolor: handleRecolor,
        onDelete: handleDelete,
      }}
    >
      <div className="glass-panel relative h-[70vh] w-full overflow-hidden rounded-2xl">
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          colorMode="dark"
          fitView
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={28} color="rgba(255,255,255,0.12)" />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable className="!bg-[var(--panel-strong)]" />
        </ReactFlow>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending}
          className="focus-ring absolute right-6 top-6 z-10 flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white shadow-lg disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Nueva nota
        </button>
      </div>
    </BoardActionsContext.Provider>
  );
}
