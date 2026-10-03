import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import avatar from "@/assets/assistant-avatar.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { createThread, deleteThread, listThreads } from "@/lib/assistant-threads";
import { ChatWindow } from "@/components/assistant/chat-window";
import { ThreadList } from "@/components/assistant/thread-list";

export const Route = createFileRoute("/assistant/$threadId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Assistant — Phoe La Min" },
      { name: "description", content: "Ask the Phoe La Min assistant about food deals, orders and how the marketplace works." },
      { property: "og:title", content: "Assistant — Phoe La Min" },
      { property: "og:description", content: "Ask about surplus food deals, orders and how Phoe La Min works." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  const { threadId } = Route.useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const threads = useQuery({ queryKey: ["assistant-threads"], queryFn: listThreads, enabled: isAuthenticated });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["assistant-threads"] });

  const go = (id: string) => void navigate({ to: "/assistant/$threadId", params: { threadId: id } });

  if (isLoading) return null;
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <img src={avatar} alt="" width={80} height={80} className="size-20" />
        <p className="font-display font-semibold">Sign in to chat with the assistant</p>
        <Button asChild><Link to="/login">Sign in</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-72 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Button variant="ghost" size="icon" aria-label="Back" onClick={() => window.history.length > 1 ? window.history.back() : void navigate({ to: "/" })}>
            <ArrowLeft className="size-4" />
          </Button>
          <img src={avatar} alt="" width={32} height={32} className="size-8" />
          <span className="font-display text-sm font-semibold">Phoe La Min Assistant</span>
        </div>
        <ThreadList
          threads={threads.data ?? []}
          activeId={threadId}
          onSelect={go}
          onNew={() => void createThread().then((id) => { refresh(); go(id); }).catch((e: Error) => toast.error(e.message))}
          onDelete={(id) =>
            void deleteThread(id)
              .then(() => {
                refresh();
                if (id === threadId) void navigate({ to: "/" });
              })
              .catch((e: Error) => toast.error(e.message))
          }
        />
      </aside>
      <main className="mx-auto flex w-full max-w-3xl min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border p-3 md:hidden">
          <Button variant="ghost" size="icon" aria-label="Back" asChild><Link to="/"><ArrowLeft className="size-4" /></Link></Button>
          <span className="font-display text-sm font-semibold">Phoe La Min Assistant</span>
        </div>
        <ChatWindow key={threadId} threadId={threadId} onActivity={refresh} />
      </main>
    </div>
  );
}
