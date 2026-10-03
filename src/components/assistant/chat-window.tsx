import { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getNearbyLocation } from "@/lib/nearby";
import { loadThreadMessages } from "@/lib/assistant-threads";
import { useAuth } from "@/lib/auth/auth-context";
import avatar from "@/assets/assistant-avatar.png";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Shimmer } from "@/components/ai-elements/shimmer";

const toolTitles: Record<string, string> = {
  search_food: "Searching food posts",
  list_vendors: "Looking up partner businesses",
  my_orders: "Checking your orders",
  my_store: "Reading your store",
  my_food_posts: "Reading your secret bags",
  platform_overview: "Platform overview",
  list_vendors_admin: "Vendor list",
  list_users_admin: "User list",
  recent_orders_admin: "Recent orders",
};

const suggestions = {
  customer: ["Show food near me", "Best deals over 50% off", "How do I pay for a pickup order?"],
  vendor: ["Which of my bags are still available?", "Show my latest orders", "How do I advertise my store?"],
  admin: ["Give me a platform overview", "Any payments awaiting verification?", "List pending vendors"],
} as const;

export function ChatWindow({ threadId, onActivity }: { threadId: string; onActivity?: () => void }) {
  const query = useQuery({
    queryKey: ["assistant-thread", threadId],
    queryFn: () => loadThreadMessages(threadId),
    staleTime: Infinity,
  });
  if (query.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (query.error || query.data === null) {
    return <p className="p-6 text-center text-sm text-muted-foreground">This conversation could not be found.</p>;
  }
  return <ChatSession key={threadId} threadId={threadId} initial={query.data ?? []} onActivity={onActivity} />;
}

function ChatSession({ threadId, initial, onActivity }: { threadId: string; initial: UIMessage[]; onActivity?: (() => void) | undefined }) {
  const { user } = useAuth();
  const role = user?.role ?? "customer";
  const qc = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        body: () => ({ threadId, location: getNearbyLocation() }),
      }),
    [threadId],
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initial,
    transport,
    onError: (err) => toast.error(err.message || "The assistant could not respond."),
    onFinish: ({ messages: all }) => {
      qc.setQueryData(["assistant-thread", threadId], all);
      onActivity?.();
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy, threadId]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    void sendMessage({ text });
  };

  const handleSubmit = (msg: PromptInputMessage) => send(msg.text);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-5 px-4 py-4">
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <img src={avatar} alt="" width={72} height={72} className="size-18" />
              <div className="space-y-1">
                <h3 className="font-display text-base font-semibold">Hi{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}! How can I help?</h3>
                <p className="text-sm text-muted-foreground">
                  I answer using live information from Phoe La Min.
                </p>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {suggestions[role].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent
                  className={
                    m.role === "user"
                      ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground"
                      : "bg-transparent p-0"
                  }
                >
                  {m.parts.map((part, i) => {
                    if (part.type === "text") {
                      return m.role === "user" ? (
                        <p key={i} className="whitespace-pre-wrap">{part.text}</p>
                      ) : (
                        <MessageResponse key={i}>{part.text}</MessageResponse>
                      );
                    }
                    if (part.type.startsWith("tool-") && "state" in part) {
                      const tp = part as Extract<typeof part, { toolCallId: string }>;
                      const name = part.type.slice(5);
                      return (
                        <Tool key={i} defaultOpen={false} className="mb-0">
                          <ToolHeader
                            type={tp.type as `tool-${string}`}
                            state={tp.state}
                            title={toolTitles[name] ?? name}
                          />
                          <ToolContent>
                            <ToolInput input={tp.input} />
                            <ToolOutput
                              output={"output" in tp ? tp.output : undefined}
                              errorText={"errorText" in tp ? tp.errorText : undefined}
                            />
                          </ToolContent>
                        </Tool>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent className="bg-transparent p-0">
                <Shimmer>Thinking...</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t border-border p-3">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea ref={textareaRef} placeholder="Ask about food, orders, or how things work…" />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

