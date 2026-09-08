"use client";

import "@xyflow/react/dist/style.css";
import { createContext, useCallback, useContext, useRef, useState, useTransition } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeResizer,
  Handle,
  Position,
  ConnectionMode,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeProps,
  type EdgeProps,
} from "@xyflow/react";
import {
  Circle,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Minus,
  Square,
  StickyNote,
  Trash2,
  Type,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fileToScaledDataUrl } from "@/lib/image";
import type { BoardElementKind } from "@prisma/client";

export const STICKY_COLORS = [
  "#fef08a",
  "#fecaca",
  "#bfdbfe",
  "#bbf7d0",
  "#e9d5ff",
  "#fed7aa",
];

export type BoardItem = {
  id: string;
  kind: BoardElementKind;
  body: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  createdById: string;
  authorName: string | null;
};

export type BoardEdgeItem = {
  id: string;
  sourceId: string;
  targetId: string;
};

type ElementData = {
  kind: BoardElementKind;
  body: string;
  color: string;
  authorName: string | null;
  createdById: string;
};

function itemToNode(item: BoardItem): Node {
  return {
    id: item.id,
    type: "element",
    position: { x: item.x, y: item.y },
    width: item.width,
    height: item.height,
    data: {
      kind: item.kind,
      body: item.body,
      color: item.color,
      authorName: item.authorName,
      createdById: item.createdById,
    } satisfies ElementData,
  };
}

function edgeItemToEdge(edge: BoardEdgeItem): Edge {
  return {
    id: edge.id,
    source: edge.sourceId,
    target: edge.targetId,
    type: "arrow",
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,0.6)" },
    style: { stroke: "rgba(255,255,255,0.5)" },
  };
}

/** Elements read shared edit/delete/resize callbacks from context instead of
 * carrying them on each node's own data, so the handlers can be defined once
 * (after the nodes state exists) without needing to rebuild every node's
 * data whenever a handler identity would otherwise change. */
const BoardActionsContext = createContext<{
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (id: string, body: string) => void;
  onRecolor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  onResize: (id: string, width: number, height: number) => void;
  onDeleteEdge: (id: string) => void;
  onOpen?: (id: string) => void;
} | null>(null);

const MIN_SIZE: Record<BoardElementKind, { minWidth: number; minHeight: number }> = {
  STICKY: { minWidth: 160, minHeight: 120 },
  TEXT: { minWidth: 100, minHeight: 50 },
  TITLE: { minWidth: 120, minHeight: 44 },
  IMAGE: { minWidth: 80, minHeight: 60 },
  SHAPE_RECTANGLE: { minWidth: 40, minHeight: 30 },
  SHAPE_CIRCLE: { minWidth: 40, minHeight: 40 },
  SHAPE_LINE: { minWidth: 40, minHeight: 24 },
  SHAPE_CROSS: { minWidth: 40, minHeight: 40 },
};

const TEXT_KINDS: BoardElementKind[] = ["STICKY", "TEXT", "TITLE"];

function ShapeGraphic({ kind, color }: { kind: BoardElementKind; color: string }) {
  if (kind === "SHAPE_RECTANGLE") {
    return (
      <div
        className="h-full w-full rounded-md"
        style={{ border: `3px solid ${color}`, background: `${color}22` }}
      />
    );
  }
  if (kind === "SHAPE_CIRCLE") {
    return (
      <div
        className="h-full w-full rounded-full"
        style={{ border: `3px solid ${color}`, background: `${color}22` }}
      />
    );
  }
  if (kind === "SHAPE_LINE") {
    return (
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line
          x1="2"
          y1="50"
          x2="98"
          y2="50"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }
  // SHAPE_CROSS
  return (
    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <line
        x1="4"
        y1="4"
        x2="96"
        y2="96"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1="96"
        y1="4"
        x2="4"
        y2="96"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const HANDLE_CLASS =
  "!h-3 !w-3 !border-2 !border-[var(--panel-strong)] !bg-white/70 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:!bg-[var(--accent)]";

function ElementNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as ElementData;
  const actions = useContext(BoardActionsContext);
  const [text, setText] = useState(d.body);
  const [confirming, setConfirming] = useState(false);
  if (!actions) return null;

  const canDelete = d.createdById === actions.currentUserId || actions.isAdmin;
  const { minWidth, minHeight } = MIN_SIZE[d.kind];
  const isText = TEXT_KINDS.includes(d.kind);
  const isTitle = d.kind === "TITLE";
  const isSticky = d.kind === "STICKY";
  const isImage = d.kind === "IMAGE";

  return (
    <div className="group relative h-full w-full">
      <NodeResizer
        nodeId={id}
        isVisible={selected}
        minWidth={minWidth}
        minHeight={minHeight}
        lineStyle={{ borderColor: "var(--accent)" }}
        handleStyle={{ width: 9, height: 9, borderRadius: 3, borderColor: "var(--accent)" }}
        onResizeEnd={(_event, params) => actions.onResize(id, params.width, params.height)}
      />
      <Handle type="source" position={Position.Top} id="top" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Right} id="right" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Left} id="left" className={HANDLE_CLASS} />

      <div
        className={cn(
          "flex h-full w-full flex-col overflow-hidden rounded-xl transition-shadow duration-150",
          selected
            ? "shadow-xl ring-2 ring-[var(--accent)]"
            : "shadow-md ring-1 ring-black/10 group-hover:shadow-lg group-hover:ring-black/20"
        )}
      >
        <div
          className={cn("min-h-0 flex-1", isSticky ? "flex p-2.5" : !isImage && "p-2.5")}
          style={isSticky ? { background: d.color } : undefined}
        >
          {isText ? (
            <textarea
              className={cn(
                "nodrag h-full w-full resize-none bg-transparent outline-none",
                isSticky && "text-sm text-slate-800 placeholder:text-slate-500",
                !isSticky && "placeholder:opacity-50",
                isTitle && "text-xl font-bold"
              )}
              style={!isSticky ? { color: d.color } : undefined}
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => {
                const trimmed = text.trim();
                if (trimmed !== d.body) actions.onEdit(id, trimmed);
              }}
              placeholder={isTitle ? "Título…" : isSticky ? "Escribe la idea…" : "Escribe un texto…"}
            />
          ) : isImage ? (
            d.body ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.body} alt="" draggable={false} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--panel-strong)] text-[var(--ink-3)]">
                <ImageIcon className="h-6 w-6" />
              </div>
            )
          ) : (
            <ShapeGraphic kind={d.kind} color={d.color} />
          )}
        </div>
      </div>

      {selected && (
        <div className="nodrag nopan absolute -top-11 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 whitespace-nowrap rounded-lg bg-[var(--panel-strong)] p-1 shadow-xl ring-1 ring-black/10">
          {!isImage && (
            <>
              <div className="flex gap-1 px-1">
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => actions.onRecolor(id, c)}
                    className={cn(
                      "h-4 w-4 rounded-full ring-1 ring-black/10 transition hover:scale-110",
                      d.color === c && "ring-2 ring-[var(--accent)]"
                    )}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
              </div>
              <span className="h-4 w-px bg-[var(--panel-border)]" />
            </>
          )}
          {isSticky && actions.onOpen && (
            <button
              type="button"
              onClick={() => actions.onOpen?.(id)}
              className="focus-ring rounded-md p-1.5 text-[var(--ink-2)] hover:bg-[var(--panel)] hover:text-[var(--ink-0)]"
              aria-label="Desarrollar idea"
              title="Desarrollar idea"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
          {d.authorName && (
            <span className="max-w-[4.5rem] truncate px-1.5 text-[10px] text-[var(--ink-3)]">
              {d.authorName}
            </span>
          )}
          {canDelete &&
            (confirming ? (
              <button
                type="button"
                onClick={() => actions.onDelete(id)}
                className="focus-ring rounded-md px-1.5 py-1 text-[10px] font-medium text-red-400 hover:bg-[var(--panel)]"
              >
                ¿Seguro?
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="focus-ring rounded-md p-1.5 text-[var(--ink-2)] hover:bg-[var(--panel)] hover:text-red-400"
                aria-label="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { element: ElementNode };

function ArrowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  selected,
}: EdgeProps) {
  const actions = useContext(BoardActionsContext);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth: selected ? 2.5 : 1.5 }}
      />
      <EdgeLabelRenderer>
        <button
          type="button"
          onClick={() => actions?.onDeleteEdge(id)}
          className="nodrag nopan absolute flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-red-500 hover:text-white"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          aria-label="Eliminar conexión"
        >
          <XIcon className="h-2.5 w-2.5" />
        </button>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = { arrow: ArrowEdge };

function nextGridPosition(count: number) {
  return {
    x: 60 + (count % 5) * 260 + Math.round(Math.random() * 30),
    y: 60 + Math.floor(count / 5) * 200 + Math.round(Math.random() * 30),
  };
}

const TOOLBAR: { kind: BoardElementKind; label: string; icon: typeof StickyNote }[] = [
  { kind: "STICKY", label: "Nota", icon: StickyNote },
  { kind: "TEXT", label: "Texto", icon: Type },
  { kind: "TITLE", label: "Título", icon: Type },
  { kind: "IMAGE", label: "Imagen", icon: ImageIcon },
  { kind: "SHAPE_RECTANGLE", label: "Rectángulo", icon: Square },
  { kind: "SHAPE_CIRCLE", label: "Círculo", icon: Circle },
  { kind: "SHAPE_LINE", label: "Línea", icon: Minus },
  { kind: "SHAPE_CROSS", label: "Cruz", icon: XIcon },
];

export function BoardCanvas({
  items,
  edges: edgeItems,
  currentUserId,
  isAdmin,
  onCreate,
  onEdit,
  onRecolor,
  onMove,
  onResize,
  onDelete,
  onConnect,
  onDeleteEdge,
  onOpen,
}: {
  items: BoardItem[];
  edges: BoardEdgeItem[];
  currentUserId: string;
  isAdmin: boolean;
  onCreate: (
    kind: BoardElementKind,
    x: number,
    y: number,
    body?: string,
    width?: number,
    height?: number
  ) => Promise<BoardItem | null>;
  onEdit: (id: string, body: string) => void;
  onRecolor: (id: string, color: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onDelete: (id: string) => void;
  onConnect: (sourceId: string, targetId: string) => Promise<BoardEdgeItem | null>;
  onDeleteEdge: (id: string) => void;
  onOpen?: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [imageError, setImageError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>(() => items.map(itemToNode));
  const [edges, setEdges] = useState<Edge[]>(() => edgeItems.map(edgeItemToEdge));
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = useCallback(
    (id: string, body: string) => {
      onEdit(id, body);
      setNodes((ns) =>
        ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, body } } : n))
      );
    },
    [onEdit]
  );

  const handleRecolor = useCallback(
    (id: string, color: string) => {
      onRecolor(id, color);
      setNodes((ns) =>
        ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, color } } : n))
      );
    },
    [onRecolor]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onDelete(id);
      setNodes((ns) => ns.filter((n) => n.id !== id));
      setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
    },
    [onDelete]
  );

  const handleResize = useCallback(
    (id: string, width: number, height: number) => {
      onResize(id, width, height);
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, width, height } : n)));
    },
    [onResize]
  );

  const handleDeleteEdge = useCallback(
    (id: string) => {
      onDeleteEdge(id);
      setEdges((es) => es.filter((e) => e.id !== id));
    },
    [onDeleteEdge]
  );

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((ns) => applyNodeChanges(changes, ns));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((es) => applyEdgeChanges(changes, es));
  }, []);

  const onNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      onMove(node.id, node.position.x, node.position.y);
    },
    [onMove]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) {
        return;
      }
      startTransition(async () => {
        const created = await onConnect(connection.source, connection.target);
        if (created) {
          setEdges((es) =>
            addEdge(
              {
                ...connection,
                id: created.id,
                type: "arrow",
                markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,0.6)" },
                style: { stroke: "rgba(255,255,255,0.5)" },
              },
              es
            )
          );
        }
      });
    },
    [onConnect]
  );

  function handleAdd(kind: BoardElementKind) {
    if (kind === "IMAGE") {
      imageInputRef.current?.click();
      return;
    }
    startTransition(async () => {
      const { x, y } = nextGridPosition(nodes.length);
      const created = await onCreate(kind, x, y);
      if (created) {
        setNodes((ns) => [...ns, itemToNode(created)]);
      }
    });
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Selecciona un archivo de imagen");
      return;
    }
    setImageError(null);
    startTransition(async () => {
      try {
        const bitmap = await createImageBitmap(file);
        const maxWidth = 320;
        const scale = Math.min(1, maxWidth / bitmap.width);
        const width = Math.max(80, Math.round(bitmap.width * scale));
        const height = Math.max(60, Math.round(bitmap.height * scale));
        const dataUrl = await fileToScaledDataUrl(file, 1000, 0.82);

        const { x, y } = nextGridPosition(nodes.length);
        const created = await onCreate("IMAGE", x, y, dataUrl, width, height);
        if (created) {
          setNodes((ns) => [...ns, itemToNode(created)]);
        } else {
          setImageError("No se pudo agregar la imagen");
        }
      } catch {
        setImageError("No se pudo procesar la imagen");
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
        onResize: handleResize,
        onDeleteEdge: handleDeleteEdge,
        onOpen,
      }}
    >
      <div className="glass-panel relative h-full w-full overflow-hidden rounded-2xl">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onConnect={handleConnect}
          connectionMode={ConnectionMode.Loose}
          colorMode="dark"
          fitView
          minZoom={0.15}
          maxZoom={2}
          deleteKeyCode={null}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={28} color="rgba(255,255,255,0.12)" />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable className="!bg-[var(--panel-strong)]" />
        </ReactFlow>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFile}
        />
        <div className="absolute right-6 top-6 z-10 flex flex-col items-end gap-1.5">
          <div className="flex gap-1 rounded-lg bg-[var(--panel-strong)] p-1 shadow-lg">
            {TOOLBAR.map(({ kind, label, icon: Icon }) => (
              <button
                key={kind}
                type="button"
                onClick={() => handleAdd(kind)}
                disabled={isPending}
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-1)] hover:bg-[var(--panel)] disabled:opacity-60"
                title={label}
                aria-label={label}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
              </button>
            ))}
          </div>
          {imageError && (
            <p className="rounded-md bg-[var(--panel-strong)] px-2 py-1 text-xs text-red-400 shadow-lg">
              {imageError}
            </p>
          )}
        </div>
      </div>
    </BoardActionsContext.Provider>
  );
}
