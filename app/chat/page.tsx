import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/auth-guard";
import { PageHeader } from "@/components/admin/ui";
import { ChatClient } from "@/components/chat/ChatClient";

export const metadata = { title: "Chat — Sinkronisasi RPP" };

export default async function ChatPage() {
  const session = await requireUser();
  if (session.user.role !== Role.GURU && session.user.role !== Role.PJ_DINIYYAH) {
    redirect(session.user.role === Role.ADMIN ? "/admin" : "/");
  }

  return (
    <div>
      <PageHeader
        title="Chat"
        subtitle={session.user.role === Role.GURU ? "Hubungi Kabag/PJ Kurikulum secara langsung." : "Hubungi guru secara langsung."}
      />
      <ChatClient currentUserId={session.user.id} role={session.user.role} mode="page" />
    </div>
  );
}
