import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { getActiveChatUser, getChatContacts, getChatConversations, isChatRole } from "@/lib/chat/queries";
import { SendChatMessageSchema } from "@/lib/chat/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Silakan login untuk menggunakan Chat." }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();
  const user = await getActiveChatUser(session.user.id);
  if (!user || !isChatRole(user.role)) {
    return NextResponse.json({ error: "Chat hanya tersedia untuk Guru dan Kabag/PJ Diniyyah." }, { status: 403 });
  }

  const [contacts, conversations] = await Promise.all([
    getChatContacts(user.id, user.role),
    getChatConversations(user.id, user.role),
  ]);
  return NextResponse.json({ contacts, conversations });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();
  const user = await getActiveChatUser(session.user.id);
  if (!user || !isChatRole(user.role)) {
    return NextResponse.json({ error: "Akses Chat tidak diizinkan." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data pesan tidak valid." }, { status: 400 });
  }
  const parsed = SendChatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Pesan tidak valid." }, { status: 400 });
  }

  const recipient = await prisma.user.findFirst({
    where:
      user.role === Role.GURU
        ? { id: parsed.data.recipientId, role: Role.PJ_DINIYYAH, aktif: true, deletedAt: null }
        : { id: parsed.data.recipientId, role: Role.GURU, aktif: true, deletedAt: null, guru: { deletedAt: null } },
    select: { id: true },
  });
  if (!recipient) return NextResponse.json({ error: "Penerima tidak tersedia atau sudah tidak aktif." }, { status: 400 });

  const pair = user.role === Role.GURU
    ? { guruId: user.id, pjId: recipient.id }
    : { guruId: recipient.id, pjId: user.id };

  const conversation = await prisma.chatConversation.upsert({
    where: { guruId_pjId: pair },
    create: pair,
    update: {},
    select: { id: true },
  });
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: { conversationId: conversation.id, senderId: user.id, isi: parsed.data.isi },
      select: { id: true, isi: true, senderId: true, createdAt: true },
    });
    await tx.chatConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
    return created;
  });

  return NextResponse.json({
    conversationId: conversation.id,
    message: { ...message, createdAt: message.createdAt.toISOString() },
  }, { status: 201 });
}
