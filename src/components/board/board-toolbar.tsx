"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "@/components/board/create-project-dialog";
import type { Platform } from "@prisma/client";

export function BoardToolbar({ platform }: { platform: Platform }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <FolderPlus className="h-4 w-4" />
        Nuevo proyecto
      </Button>
      <CreateProjectDialog open={open} onOpenChange={setOpen} defaultPlatform={platform} />
    </>
  );
}
