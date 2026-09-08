"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImageIcon, Loader2, Paperclip, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { fileToScaledDataUrl, readFileAsDataUrl } from "@/lib/image";
import { addAttachment, deleteAttachment } from "@/app/actions/attachments";

const MAX_DOCUMENT_BYTES = 8_000_000;
const MAX_IMAGE_SOURCE_BYTES = 20_000_000;

type Attachment = {
  id: string;
  kind: "IMAGE" | "DOCUMENT";
  name: string;
  dataUrl: string;
  size: number;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsSection({
  taskId,
  attachments,
}: {
  taskId: string;
  attachments: Attachment[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const isImage = file.type.startsWith("image/");

        if (isImage && file.size > MAX_IMAGE_SOURCE_BYTES) {
          setError(`"${file.name}" es demasiado grande.`);
          continue;
        }
        if (!isImage && file.size > MAX_DOCUMENT_BYTES) {
          setError(`"${file.name}" supera el máximo de 8 MB.`);
          continue;
        }

        const dataUrl = isImage
          ? await fileToScaledDataUrl(file)
          : await readFileAsDataUrl(file);

        const fd = new FormData();
        fd.set("kind", isImage ? "IMAGE" : "DOCUMENT");
        fd.set("name", file.name);
        fd.set("dataUrl", dataUrl);
        fd.set("size", String(file.size));

        const result = await addAttachment(taskId, fd);
        if (result?.error) {
          setError(result.error);
        }
      }
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  function handleDelete(id: string) {
    void deleteAttachment(id).then(() => router.refresh());
  }

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between">
        <Label className="mb-0">Adjuntos</Label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="focus-ring flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[var(--accent)] hover:bg-[var(--panel)] disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Paperclip className="h-3.5 w-3.5" />
          )}
          Adjuntar capturas o documentos
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          onChange={handleFiles}
          className="hidden"
        />
      </div>

      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

      {attachments.length > 0 ? (
        <div className="space-y-1.5">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="glass-panel flex items-center gap-2 rounded-lg px-2.5 py-2"
            >
              {a.kind === "IMAGE" ? (
                <ImageIcon className="h-4 w-4 shrink-0 text-[var(--ink-3)]" />
              ) : (
                <FileText className="h-4 w-4 shrink-0 text-[var(--ink-3)]" />
              )}
              <a
                href={a.dataUrl}
                download={a.name}
                target="_blank"
                rel="noreferrer"
                className="focus-ring min-w-0 flex-1 truncate text-xs text-[var(--ink-1)] hover:text-[var(--accent)] hover:underline"
                title={a.name}
              >
                {a.name}
              </a>
              <span className="shrink-0 text-[11px] text-[var(--ink-3)]">
                {formatBytes(a.size)}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                className="focus-ring shrink-0 rounded-md p-1 text-[var(--ink-3)] hover:bg-[var(--panel-strong)] hover:text-red-400"
                aria-label={`Eliminar ${a.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--ink-3)]">Sin adjuntos todavía.</p>
      )}
    </div>
  );
}
