/** Browser-side helpers for the signed-in user's assistant conversations. */
import type { UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";

export interface ChatThread {
  id: string;
  title: string;
  updated_at: string;
}

export async function listThreads(): Promise<ChatThread[]> {
  const { data, error } = await supabase
    .from("chat_threads")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function createThread(): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Please sign in to use the assistant.");
  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ user_id: auth.user.id })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function loadThreadMessages(id: string): Promise<UIMessage[] | null> {
  const { data, error } = await supabase.from("chat_threads").select("messages").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return Array.isArray(data.messages) ? (data.messages as unknown as UIMessage[]) : [];
}

export async function deleteThread(id: string) {
  const { error } = await supabase.from("chat_threads").delete().eq("id", id);
  if (error) throw error;
}
