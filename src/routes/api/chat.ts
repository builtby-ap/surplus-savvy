import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { z } from "zod";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai/run-id.server";
import { systemPrompt, toolsForRole, type AssistantRole } from "@/lib/ai/assistant-tools.server";

const bodySchema = z.object({
  threadId: z.string().uuid(),
  messages: z.array(z.any()),
  location: z.object({ lat: z.number(), lng: z.number() }).nullable().optional(),
});

function titleFrom(messages: UIMessage[]) {
  const first = messages.find((m) => m.role === "user");
  const text = first?.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim() ?? "";
  return text ? text.slice(0, 60) : "New chat";
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token || token.split(".").length !== 3) return new Response("Please sign in to use the assistant.", { status: 401 });

        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid request", { status: 400 });
        const { threadId, location } = parsed.data;
        const messages = parsed.data.messages as UIMessage[];

        const url = process.env["SUPABASE_URL"]!;
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
        const db = createClient<Database>(url, key, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: claims, error: authError } = await db.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (authError || !userId) return new Response("Please sign in to use the assistant.", { status: 401 });

        // Thread must belong to this user (RLS scoped).
        const { data: thread } = await db.from("chat_threads").select("id, title").eq("id", threadId).maybeSingle();
        if (!thread) return new Response("Conversation not found", { status: 404 });

        // Identify role from the server-side roles table.
        const [{ data: roles }, { data: profile }] = await Promise.all([
          db.from("user_roles").select("role").eq("user_id", userId),
          db.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
        ]);
        const roleSet = new Set((roles ?? []).map((r) => r.role));
        const role: AssistantRole = roleSet.has("admin") ? "admin" : roleSet.has("food_vendor") ? "vendor" : "customer";

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Assistant is not configured.", { status: 500 });
        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });

        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          system: systemPrompt(role, profile?.full_name ?? "", Boolean(location)),
          messages: await convertToModelMessages(messages),
          tools: toolsForRole(role, db, userId, location ?? null),
          stopWhen: stepCountIs(50),
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: messages,
            sendReasoning: true,
            onFinish: async ({ messages: all }) => {
              const { error } = await db
                .from("chat_threads")
                .update({
                  messages: all as unknown as Json,
                  title: thread.title === "New chat" ? titleFrom(all) : thread.title,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", threadId);
              if (error) console.error("[assistant] failed to save chat", error.message);
            },
            onError: (err) => {
              console.error("[assistant]", err);
              const status = (err as { statusCode?: number })?.statusCode;
              if (status === 429) return "The assistant is busy right now. Please try again in a moment.";
              if (status === 402) return "AI credits have run out. Please contact the site owner.";
              return "Sorry, something went wrong answering that.";
            },
          }),
          runIdFetch,
        );
      },
    },
  },
});
