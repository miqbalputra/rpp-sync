"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { ChatClient } from "./ChatClient";

type ChatRole = "GURU" | "PJ_DINIYYAH";

export function ChatWidget({ currentUserId, role }: { currentUserId: string; role: ChatRole }) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadUnread = async () => {
      try {
        const response = await fetch("/api/chat", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { conversations?: { unreadCount: number }[] };
        if (!cancelled) setUnreadCount((payload.conversations ?? []).reduce((total, item) => total + item.unreadCount, 0));
      } catch {
        // Widget tetap tersembunyi dari error jaringan sementara.
      }
    };
    void loadUnread();
    const interval = window.setInterval(() => void loadUnread(), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <>
      {!open && (
        <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-theme-xl transition hover:-translate-y-0.5 hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30" aria-label="Buka chat">
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-error-500 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </button>
      )}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 max-sm:bottom-0 max-sm:right-0">
          <ChatClient currentUserId={currentUserId} role={role} mode="widget" onClose={() => setOpen(false)} onUnreadCount={setUnreadCount} />
        </div>
      )}
    </>
  );
}
