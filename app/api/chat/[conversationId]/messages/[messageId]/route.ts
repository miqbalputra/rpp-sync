import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveChatUser, isChatRole } from "@/lib/chat/queries";
import { ChatConversationIdSchema, ChatMessageIdSchema } from "@/lib/chat/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Silakan login untuk menghapus pesan." }, { status: 401 });
  }

  const user = await getActiveChatUser(session.user.id);
  if (!user || !isChatRole(user.role)) {
    return NextResponse.json({ error: "Akses Chat tidak diizinkan." }, { status: 403 });
  }

  const { conversationId, messageId } = await params;
  const parsedConversationId = ChatConversationIdSchema.safeParse(conversationId);
  const parsedMessageId = ChatMessageIdSchema.safeParse(messageId);
  if (!parsedConversationId.success || !parsedMessageId.success) {
    return NextResponse.json({ error: "Pesan tidak valid." }, { status: 400 });
  }

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: parsedConversationId.data },
    select: { guruId: true, pjId: true },
  });
  if (!conversation || (conversation.guruId !== user.id && conversation.pjId !== user.id)) {
    return NextResponse.json({ error: "Percakapan tidak ditemukan." }, { status: 404 });
  }

  const message = await prisma.chatMessage.findFirst({
    where: {
      id: parsedMessageId.data,
      conversationId: parsedConversationId.data,
      senderId: user.id,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!message) {
    return NextResponse.json({ error: "Pesan tidak ditemukan atau bukan pesan Anda." }, { status: 404 });
  }

  const deletedAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.chatMessage.update({
      where: { id: message.id },
      data: { isi: "", deletedAt },
    });
    await tx.chatConversation.update({
      where: { id: parsedConversationId.data },
      data: { updatedAt: deletedAt },
    });
  });

  return NextResponse.json({ ok: true, deletedAt: deletedAt.toISOString() });
}
