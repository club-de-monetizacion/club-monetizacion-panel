"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { createIdea, deleteIdea } from "@/app/actions/ideas";
import { formatDate } from "@/lib/utils";

type Idea = {
  id: string;
  body: string;
  color: string;
  createdAt: Date;
  createdById: string;
  createdBy: { id: string; name: string | null; image: string | null };
};

export function NotesPanel({
  ideas,
  currentUserId,
  isAdmin,
}: {
  ideas: Idea[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("body", body);
      const result = await createIdea(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteIdea(id);
      router.refresh();
    });
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribe una idea…"
          rows={1}
          className="min-h-[2.25rem] resize-none py-2"
        />
        <Button type="submit" disabled={isPending || !body.trim()} size="md">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agregar"}
        </Button>
      </form>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ideas.map((idea) => (
          <div key={idea.id} className="glass-panel-strong flex items-start gap-2 rounded-lg p-3">
            <span
              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: idea.color }}
            />
            <Avatar
              src={idea.createdBy.image}
              name={idea.createdBy.name}
              size={24}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-wrap text-sm text-[var(--ink-1)]">{idea.body}</p>
              <p className="mt-1 text-[11px] text-[var(--ink-3)]">
                {idea.createdBy.name} · {formatDate(idea.createdAt)}
              </p>
            </div>
            {(idea.createdById === currentUserId || isAdmin) && (
              <button
                type="button"
                onClick={() => handleDelete(idea.id)}
                className="focus-ring shrink-0 rounded-md p-1 text-[var(--ink-3)] hover:bg-[var(--panel)] hover:text-red-400"
                aria-label="Eliminar idea"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {ideas.length === 0 && (
          <p className="px-1 py-2 text-sm text-[var(--ink-3)] sm:col-span-2 lg:col-span-3">
            Aún no hay ideas anotadas.
          </p>
        )}
      </div>
    </div>
  );
}
