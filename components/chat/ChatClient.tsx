"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
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
  const [mobileView, setMobileView] = useState<"list" | "conversation">("list");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectionInitialized = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

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
  const mobileConversationActive = mobileView === "conversation" && Boolean(selectedContact);

  const chooseConversation = (conversationId: string) => {
    setSelectedId(conversationId);
    setPendingContactId(null);
    setMessages([]);
    setMobileView("conversation");
    setError(null);
  };

  const chooseContact = (contactId: string) => {
    const conversation = data.conversations.find((item) => item.participant.id === contactId);
    if (conversation) return chooseConversation(conversation.id);
    setSelectedId(null);
    setPendingContactId(contactId);
    setMessages([]);
    setMobileView("conversation");
    setError(null);
  };

  const returnToList = () => {
    setMobileView("list");
    setError(null);
  };

  const handleDraftChange = (value: string, textarea: HTMLTextAreaElement) => {
    setDraft(value);
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
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
      if (composerRef.current) composerRef.current.style.height = "auto";
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
  const subtitle = "Pesan pribadi dan langsung";
  const panelClass = mode === "widget"
    ? "flex h-[min(680px,calc(100vh-5.5rem))] w-[min(720px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-gray-900 max-md:h-[100dvh] max-md:w-screen max-md:rounded-none"
    : "flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 md:h-[min(680px,calc(100vh-13rem))] md:min-h-[560px]";

  return (
    <Card className={panelClass}>
      <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-4 py-3.5 text-white sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {mobileConversationActive && (
            <button
              type="button"
              onClick={returnToList}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/90 transition hover:bg-white/15 hover:text-white md:hidden"
              aria-label="Kembali ke daftar percakapan"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15", mobileConversationActive && "hidden md:flex")}>
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="break-words text-base font-semibold leading-tight sm:text-lg">
              {mobileConversationActive && selectedContact ? selectedContact.nama : title}
            </h2>
            <p className="mt-0.5 break-words text-xs text-blue-100 sm:text-sm">
              {mobileConversationActive && selectedContact ? personLabel(selectedContact.role) : subtitle}
            </p>
          </div>
        </div>
        {mode === "widget" && onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="ml-3 shrink-0 text-white hover:bg-white/15 hover:text-white"
            aria-label="Tutup chat"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="grid min-h-0 flex-1 md:grid-cols-[35%_65%]">
        <aside className={cn(
          "min-h-0 flex-col border-slate-200 dark:border-gray-800 md:flex md:border-r",
          mobileConversationActive ? "hidden" : "flex",
        )}>
          <div className="shrink-0 border-b border-slate-100 p-3 sm:p-4 dark:border-gray-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama..."
                className="h-11 border-slate-200 bg-white pl-9 text-slate-800 placeholder:text-slate-400 focus:border-blue-300 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-950/40 dark:text-white/90"
                aria-label="Cari kontak chat"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
            {loadingList ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Memuat kontak...</div>
            ) : conversations.length === 0 && newContacts.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                <Users className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                Belum ada kontak yang dapat diajak chat.
              </div>
            ) : (
              <>
                {conversations.length > 0 && <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Percakapan</p>}
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => chooseConversation(conversation.id)}
                    className={cn(
                      "mb-1.5 flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.05]",
                      selectedId === conversation.id && "bg-blue-50 ring-1 ring-inset ring-blue-100 dark:bg-blue-500/10 dark:ring-blue-500/20",
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">{initials(conversation.participant.nama)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 break-words text-sm font-semibold leading-5 text-slate-800 dark:text-white/90">{conversation.participant.nama}</p>
                        <span className="shrink-0 pt-0.5 text-[11px] text-slate-500">{formatConversationDate(conversation.updatedAt)}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="min-w-0 truncate text-xs text-slate-500 dark:text-gray-400">{conversation.lastMessage?.isi ?? "Mulai percakapan"}</p>
                        {conversation.unreadCount > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</span>}
                      </div>
                    </div>
                  </button>
                ))}
                {newContacts.length > 0 && <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Kontak lainnya</p>}
                {newContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => chooseContact(contact.id)}
                    className={cn(
                      "mb-1.5 flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.05]",
                      pendingContactId === contact.id && "bg-blue-50 ring-1 ring-inset ring-blue-100 dark:bg-blue-500/10 dark:ring-blue-500/20",
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-white/10 dark:text-gray-300">{initials(contact.nama)}</div>
                    <div className="min-w-0"><p className="break-words text-sm font-semibold leading-5 text-slate-800 dark:text-white/90">{contact.nama}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">{personLabel(contact.role)}</p></div>
                  </button>
                ))}
              </>
            )}
          </div>
        </aside>

        <section className={cn(
          "min-h-0 flex-col bg-slate-50/80 dark:bg-gray-950/20",
          mobileConversationActive ? "flex" : "hidden md:flex",
        )}>
          {selectedContact ? (
            <>
              <div className="hidden shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 md:flex">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">{initials(selectedContact.nama)}</div>
                <div className="min-w-0"><h3 className="break-words text-sm font-semibold leading-5 text-slate-800 dark:text-white/90">{selectedContact.nama}</h3><p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">{personLabel(selectedContact.role)}</p></div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Memuat percakapan...</div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-500"><MessageCircle className="mb-3 h-10 w-10 text-blue-300" /><p className="font-medium text-slate-800 dark:text-white/90">Belum ada pesan</p><p className="mt-1 text-sm">Sapa {selectedContact.nama} untuk memulai percakapan.</p></div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => {
                      const own = message.senderId === currentUserId;
                      return (
                        <div key={message.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[min(85%,34rem)] rounded-2xl px-3.5 py-2.5 shadow-sm",
                            own ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md border border-slate-200 bg-slate-100 text-slate-800 dark:border-gray-800 dark:bg-gray-800 dark:text-white/90",
                          )}>
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.isi}</p>
                            <p className={cn("mt-1 flex items-center justify-end gap-1 text-[11px]", own ? "text-blue-100" : "text-slate-500 dark:text-gray-400")}>
                              {formatTime(message.createdAt)}{own && <span aria-label={message.readAt ? "Sudah dibaca" : "Terkirim"}>{message.readAt ? " · ✓✓" : " · ✓"}</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              <div className="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 sm:p-4">
                {error && <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
                <form onSubmit={sendMessage} className="flex items-end gap-2">
                  <textarea
                    ref={composerRef}
                    value={draft}
                    onChange={(event) => handleDraftChange(event.target.value, event.currentTarget)}
                    onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}
                    rows={1}
                    maxLength={2000}
                    placeholder="Tulis pesan..."
                    className="min-h-11 min-w-0 flex-1 resize-none overflow-y-auto rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-5 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-950/50 dark:text-white/90"
                    aria-label="Isi pesan"
                  />
                  <Button type="submit" size="icon" disabled={!draft.trim() || sending} aria-label="Kirim pesan" className="h-11 w-11 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700">
                    {sending ? <Loader2 className="animate-spin" /> : <Send />}
                  </Button>
                </form>
                <p className="mt-2 text-xs text-slate-400">Maksimal 2.000 karakter <span aria-hidden="true">•</span> Shift+Enter untuk baris baru</p>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center text-slate-500">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10"><MessageCircle className="h-8 w-8" /></div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white/90">Pilih kontak untuk mulai chat</h3>
              <p className="mt-1 max-w-sm text-sm">Hubungi {role === "GURU" ? "Kabag/PJ Kurikulum" : "guru"} secara langsung melalui ruang chat ini.</p>
            </div>
          )}
        </section>
      </div>
    </Card>
  );
}
