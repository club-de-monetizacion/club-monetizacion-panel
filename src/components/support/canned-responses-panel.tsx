"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
} from "@/app/actions/support-resources";

type CannedResponse = {
  id: string;
  title: string;
  body: string;
  createdBy: { name: string | null } | null;
};

export function CannedResponsesPanel({ items }: { items: CannedResponse[] }) {
  const [editing, setEditing] = useState<CannedResponse | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--ink-0)]">
            Respuestas rápidas
          </h3>
          <p className="text-xs text-[var(--ink-3)]">
            Guarda respuestas frecuentes para copiarlas y pegarlas al instante.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Nueva respuesta
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="glass-panel flex flex-col rounded-xl p-3.5">
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium text-[var(--ink-0)]">{item.title}</h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus-ring shrink-0 rounded-md p-1 text-[var(--ink-3)] hover:bg-[var(--panel-strong)]">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditing(item)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </DropdownMenuItem>
                  <DeleteMenuItem id={item.id} />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="mb-3 line-clamp-4 flex-1 whitespace-pre-wrap text-xs text-[var(--ink-2)]">
              {item.body}
            </p>
            <CopyButton text={item.body} className="self-start" />
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="glass-panel rounded-2xl p-10 text-center text-sm text-[var(--ink-3)]">
          Aún no hay respuestas guardadas. Crea la primera para agilizar al equipo.
        </div>
      )}

      {(creating || editing) && (
        <CannedResponseDialog
          item={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function DeleteMenuItem({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <DropdownMenuItem
        className="text-red-400"
        onSelect={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await deleteCannedResponse(id);
            router.refresh();
          });
        }}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        ¿Confirmar?
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem
      className="text-red-400"
      onSelect={(e) => {
        e.preventDefault();
        setConfirming(true);
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
      Eliminar
    </DropdownMenuItem>
  );
}

function CannedResponseDialog({
  item,
  onClose,
}: {
  item: CannedResponse | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = item
        ? await updateCannedResponse(item.id, formData)
        : await createCannedResponse(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>{item ? "Editar respuesta" : "Nueva respuesta rápida"}</DialogTitle>
        <DialogDescription>
          Se guarda para que cualquiera del equipo la copie cuando la necesite.
        </DialogDescription>

        <form action={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              defaultValue={item?.title}
              required
              autoFocus
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="body">Respuesta</Label>
            <Textarea
              id="body"
              name="body"
              defaultValue={item?.body}
              rows={6}
              required
              className="mt-1.5"
              placeholder="Escribe el mensaje tal como quieres que se copie…"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
