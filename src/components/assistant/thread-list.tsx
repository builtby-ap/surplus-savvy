import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatThread } from "@/lib/assistant-threads";
import { cn } from "@/lib/utils";

export function ThreadList({
  threads,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  threads: ChatThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-3">
        <Button onClick={onNew} className="w-full" size="sm">
          <Plus className="size-4" /> New conversation
        </Button>
      </div>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {threads.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">No conversations yet.</li>
        )}
        {threads.map((t) => (
          <li
            key={t.id}
            className={cn(
              "group flex items-center gap-1 rounded-xl pr-1 transition-colors hover:bg-secondary",
              t.id === activeId && "bg-secondary",
            )}
          >
            <button type="button" onClick={() => onSelect(t.id)} className="min-w-0 flex-1 px-3 py-2 text-left">
              <span className="block truncate text-sm font-medium">{t.title}</span>
              <span className="block text-xs text-muted-foreground">
                {new Date(t.updated_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </button>
            <button
              type="button"
              aria-label="Delete conversation"
              onClick={() => onDelete(t.id)}
              className="rounded-lg p-2 text-muted-foreground opacity-60 hover:bg-background hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
