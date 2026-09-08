"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  MessageCircle,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ChatRole = "GURU" | "PJ_DINIYYAH";

type ChatPerson = {
  id: string;
  nama: string;
  role: ChatRole;
};

type ChatMessage = {
  id: string;
  isi: string;
  senderId: string;
  createdAt: string;
  readAt: string | null;
  sender?: ChatPerson;
};

type ConversationSummary = {
  id: string;
  participant: ChatPerson;
  lastMessage: { isi: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
  updatedAt: string;
};

type ChatListData = {
  contacts: ChatPerson[];
  conversations: ConversationSummary[];
};

type ChatClientProps = {
  currentUserId: string;
  role: ChatRole;
  mode: "page" | "widget";
  onClose?: () => void;
  onUnreadCount?: (count: number) => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatConversationDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return formatTime(value);
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(date);
}

function personLabel(role: ChatRole) {
  return role === "GURU" ? "Guru" : "Kabag/PJ Kurikulum";
}

export function ChatClient({
  currentUserId,
  role,
  mode,
  onClose,
  onUnreadCount,
}: ChatClientProps) {
  const [data, setData] = useState<ChatListData>({ contacts: [], conversations: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingContactId, setPendingContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectionInitialized = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    try {
      const response = await fetch("/api/chat", { cache: "no-store" });
      const payload = (await response.json()) as ChatListData & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Chat belum dapat dimuat.");

      const contacts = payload.contacts ?? [];
      const conversations = payload.conversations ?? [];
      setData({ contacts, conversations });
      if (!selectionInitialized.current) {
        selectionInitialized.current = true;
        setSelectedId(conversations[0]?.id ?? null);
        setPendingContactId(conversations.length ? null : contacts[0]?.id ?? null);
      }
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Chat belum dapat dimuat.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      // Beri React kesempatan menyelesaikan render pemilihan percakapan
      // sebelum menyalakan indikator loading pada polling/effect.
      await Promise.resolve();
      setLoadingMessages(true);
      const response = await fetch(`/api/chat/${conversationId}`, { cache: "no-store" });
      const payload = (await response.json()) as { messages?: ChatMessage[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Percakapan belum dapat dimuat.");
      setMessages(payload.messages ?? []);
      setData((current) => ({
        ...current,
        conversations: current.conversations.map((item) =>
          item.id === conversationId ? { ...item, unreadCount: 0 } : item,
        ),
      }));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Percakapan belum dapat dimuat.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!cancelled) await loadList();
    };
    void load();
    const interval = window.setInterval(() => void load(), 10000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) return;
    const initialLoad = window.setTimeout(() => void loadConversation(selectedId), 0);
    const interval = window.setInterval(() => void loadConversation(selectedId), 5000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadConversation, selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    onUnreadCount?.(data.conversations.reduce((total, item) => total + item.unreadCount, 0));
  }, [data.conversations, onUnreadCount]);

  const selectedConversation = useMemo(
    () => data.conversations.find((item) => item.id === selectedId) ?? null,
    [data.conversations, selectedId],
  );
  const selectedContact = selectedConversation?.participant
    ?? data.contacts.find((item) => item.id === pendingContactId)
    ?? null;
  const search = query.trim().toLowerCase();
  const conversations = data.conversations.filter((item) =>
    !search || item.participant.nama.toLowerCase().includes(search),
  );
  const conversationIds = new Set(data.conversations.map((item) => item.participant.id));
  const newContacts = data.contacts.filter((item) =>
    !conversationIds.has(item.id) && (!search || item.nama.toLowerCase().includes(search)),
  );

  const chooseConversation = (conversationId: string) => {
    setSelectedId(conversationId);
    setPendingContactId(null);
    setMessages([]);
    setError(null);
  };

  const chooseContact = (contactId: string) => {
    const conversation = data.conversations.find((item) => item.participant.id === contactId);
    if (conversation) return chooseConversation(conversation.id);
    setSelectedId(null);
    setPendingContactId(contactId);
    setMessages([]);
    setError(null);
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isi = draft.trim();
    if (!isi || !selectedContact || sending) return;

    try {
      setSending(true);
      const endpoint = selectedId ? `/api/chat/${selectedId}` : "/api/chat";
      const body = selectedId ? { isi } : { recipientId: selectedContact.id, isi };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { conversationId?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Pesan belum terkirim.");

      setDraft("");
      setError(null);
      if (!selectedId && payload.conversationId) {
        setPendingContactId(null);
        setSelectedId(payload.conversationId);
      } else if (selectedId) {
        await loadConversation(selectedId);
      }
      await loadList();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pesan belum terkirim.");
    } finally {
      setSending(false);
    }
  };

  const title = role === "GURU" ? "Chat Kabag / Kurikulum" : "Chat Guru";
  const panelClass = mode === "widget"
    ? "flex h-[min(650px,calc(100vh-5.5rem))] w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-gray-900"
    : "flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 lg:h-[calc(100vh-13rem)]";

  return (
    <Card className={panelClass}>
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 text-white dark:border-gray-800">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-semibold">{title}</h2>
            <p className="truncate text-xs text-white/75">Pesan pribadi dan langsung</p>
          </div>
        </div>
        {mode === "widget" && onClose && (
          <Button type="button" variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/15 hover:text-white" aria-label="Tutup chat">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(210px,280px)_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-gray-200 dark:border-gray-800 md:border-b-0 md:border-r">
          <div className="border-b border-gray-100 p-3 dark:border-gray-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama..." className="h-10 pl-9" aria-label="Cari kontak chat" />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loadingList ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Memuat kontak...</div>
            ) : conversations.length === 0 && newContacts.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                <Users className="mx-auto mb-2 h-7 w-7 text-gray-300" />
                Belum ada kontak yang dapat diajak chat.
              </div>
            ) : (
              <>
                {conversations.length > 0 && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Percakapan</p>}
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => chooseConversation(conversation.id)}
                    className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-muted/70", selectedId === conversation.id && "bg-brand-50 dark:bg-brand-500/10")}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">{initials(conversation.participant.nama)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{conversation.participant.nama}</p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{formatConversationDate(conversation.updatedAt)}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-muted-foreground">{conversation.lastMessage?.isi ?? "Mulai percakapan"}</p>
                        {conversation.unreadCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</span>}
                      </div>
                    </div>
                  </button>
                ))}
                {newContacts.length > 0 && <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Kontak lainnya</p>}
                {newContacts.map((contact) => (
                  <button key={contact.id} type="button" onClick={() => chooseContact(contact.id)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-muted/70", pendingContactId === contact.id && "bg-brand-50 dark:bg-brand-500/10")}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">{initials(contact.nama)}</div>
                    <div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{contact.nama}</p><p className="text-xs text-muted-foreground">{personLabel(contact.role)}</p></div>
                  </button>
                ))}
              </>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-gray-50/70 dark:bg-gray-950/20">
          {selectedContact ? (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">{initials(selectedContact.nama)}</div>
                <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-foreground">{selectedContact.nama}</h3><p className="text-xs text-muted-foreground">{personLabel(selectedContact.role)}</p></div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Memuat percakapan...</div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center text-muted-foreground"><MessageCircle className="mb-3 h-10 w-10 text-brand-300" /><p className="font-medium text-foreground">Belum ada pesan</p><p className="mt-1 text-sm">Sapa {selectedContact.nama} untuk memulai percakapan.</p></div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => {
                      const own = message.senderId === currentUserId;
                      return <div key={message.id} className={cn("flex", own ? "justify-end" : "justify-start")}><div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm", own ? "rounded-br-md bg-brand-500 text-white" : "rounded-bl-md border border-gray-200 bg-white text-foreground dark:border-gray-800 dark:bg-gray-900")}><p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.isi}</p><p className={cn("mt-1 text-right text-[10px]", own ? "text-white/70" : "text-muted-foreground")}>{formatTime(message.createdAt)}</p></div></div>;
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              <div className="shrink-0 border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                {error && <p className="mb-2 text-xs text-error-600 dark:text-error-400">{error}</p>}
                <form onSubmit={sendMessage} className="flex items-end gap-2">
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={2} maxLength={2000} placeholder="Tulis pesan... (Enter untuk kirim)" className="min-h-11 max-h-32 flex-1 resize-none rounded-xl border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-foreground shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-950/50" aria-label="Isi pesan" />
                  <Button type="submit" size="icon" disabled={!draft.trim() || sending} aria-label="Kirim pesan" className="h-11 w-11 shrink-0 rounded-xl">{sending ? <Loader2 className="animate-spin" /> : <Send />}</Button>
                </form>
                <p className="mt-1.5 text-[10px] text-muted-foreground">Maksimal 2.000 karakter · Shift+Enter untuk baris baru</p>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center text-muted-foreground">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10"><MessageCircle className="h-8 w-8" /></div>
              <h3 className="text-base font-semibold text-foreground">Pilih kontak untuk mulai chat</h3>
              <p className="mt-1 max-w-sm text-sm">Hubungi {role === "GURU" ? "Kabag/PJ Kurikulum" : "guru"} secara langsung melalui ruang chat ini.</p>
            </div>
          )}
        </section>
      </div>
    </Card>
  );
}
