import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, History, Maximize2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import avatar from "@/assets/assistant-avatar.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { createThread, deleteThread, listThreads } from "@/lib/assistant-threads";
import { ChatWindow } from "./chat-window";
import { ThreadList } from "./thread-list";

export function AssistantWidget() {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "list">("chat");
  const [activeId, setActiveId] = useState<string | null>(null);
  const qc = useQueryClient();

  const threadsQuery = useQuery({
    queryKey: ["assistant-threads"],
    queryFn: listThreads,
    enabled: open && isAuthenticated,
  });

  if (pathname.startsWith("/assistant") || pathname === "/login" || pathname.startsWith("/register") || pathname === "/vendor/register") {
    return null;
  }

  const refreshList = () => void qc.invalidateQueries({ queryKey: ["assistant-threads"] });

  const startNew = async () => {
    try {
      const id = await createThread();
      setActiveId(id);
      setView("chat");
      refreshList();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const openPanel = async () => {
    setOpen(true);
    if (!isAuthenticated || activeId) return;
    try {
      const threads = await qc.fetchQuery({ queryKey: ["assistant-threads"], queryFn: listThreads });
      if (threads[0]) setActiveId(threads[0].id);
      else await startNew();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteThread(id);
      if (id === activeId) setActiveId(null);
      refreshList();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-x-3 bottom-24 top-20 z-50 flex flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-lifted sm:inset-x-auto sm:right-6 sm:top-auto sm:h-[min(640px,calc(100vh-8rem))] sm:w-[400px]">
          <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-2.5">
            {view === "list" ? (
              <Button variant="ghost" size="icon" aria-label="Back to chat" onClick={() => setView("chat")} disabled={!activeId}>
                <ArrowLeft className="size-4" />
              </Button>
            ) : (
              <img src={avatar} alt="" width={36} height={36} className="size-9" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold leading-tight">Phoe La Min Assistant</p>
              <p className="text-xs text-muted-foreground">{view === "list" ? "Your conversations" : "Answers from live site data"}</p>
            </div>
            {isAuthenticated && view === "chat" && (
              <>
                <Button variant="ghost" size="icon" aria-label="Conversations" onClick={() => setView("list")}>
                  <History className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="New conversation" onClick={() => void startNew()}>
                  <Plus className="size-4" />
                </Button>
                {activeId && (
                  <Button variant="ghost" size="icon" aria-label="Open full page" asChild>
                    <Link to="/assistant/$threadId" params={{ threadId: activeId }} onClick={() => setOpen(false)}>
                      <Maximize2 className="size-4" />
                    </Link>
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" size="icon" aria-label="Close assistant" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </Button>
          </header>

          {!isAuthenticated ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <img src={avatar} alt="" width={80} height={80} className="size-20" />
              <p className="font-display font-semibold">Sign in to chat with the assistant</p>
              <p className="text-sm text-muted-foreground">Your conversations are saved to your account.</p>
              <Button asChild disabled={isLoading}>
                <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>
              </Button>
            </div>
          ) : view === "list" ? (
            <ThreadList
              threads={threadsQuery.data ?? []}
              activeId={activeId}
              onSelect={(id) => {
                setActiveId(id);
                setView("chat");
              }}
              onNew={() => void startNew()}
              onDelete={(id) => void remove(id)}
            />
          ) : activeId ? (
            <ChatWindow key={activeId} threadId={activeId} onActivity={refreshList} />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <Button onClick={() => void startNew()}>Start a conversation</Button>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        aria-label={open ? "Close assistant" : "Open assistant"}
        onClick={() => (open ? setOpen(false) : void openPanel())}
        className="fixed bottom-5 right-5 z-50 flex size-16 items-center justify-center rounded-full border-2 border-primary bg-card shadow-lifted transition-transform hover:scale-105 sm:right-6"
      >
        {open ? <X className="size-6 text-primary" /> : <img src={avatar} alt="" width={48} height={48} className="size-12" />}
      </button>
    </>
  );
}
