import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveChatUser, getChatConversationForUser, isChatRole, markChatConversationRead } from "@/lib/chat/queries";
import { ChatConversationIdSchema, SendChatMessageSchema } from "@/lib/chat/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAuthorizedUser() {
  const session = await auth();
  if (!session?.user) return null;
  const user = await getActiveChatUser(session.user.id);
  return user && isChatRole(user.role) ? user : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "Akses Chat tidak diizinkan." }, { status: 403 });
  const { conversationId } = await params;
  const parsedId = ChatConversationIdSchema.safeParse(conversationId);
  if (!parsedId.success) return NextResponse.json({ error: "Percakapan tidak valid." }, { status: 400 });

  const conversation = await getChatConversationForUser(parsedId.data, user.id);
  if (!conversation) return NextResponse.json({ error: "Percakapan tidak ditemukan." }, { status: 404 });
  await markChatConversationRead(parsedId.data, user.id);
  return NextResponse.json(conversation);
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "Akses Chat tidak diizinkan." }, { status: 403 });
  const { conversationId } = await params;
  const parsedId = ChatConversationIdSchema.safeParse(conversationId);
  if (!parsedId.success) return NextResponse.json({ error: "Percakapan tidak valid." }, { status: 400 });
  const marked = await markChatConversationRead(parsedId.data, user.id);
  if (!marked) return NextResponse.json({ error: "Percakapan tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "Akses Chat tidak diizinkan." }, { status: 403 });
  const { conversationId } = await params;
  const parsedId = ChatConversationIdSchema.safeParse(conversationId);
  if (!parsedId.success) return NextResponse.json({ error: "Percakapan tidak valid." }, { status: 400 });
  const conversation = await prisma.chatConversation.findUnique({ where: { id: parsedId.data }, select: { guruId: true, pjId: true } });
  if (!conversation || (conversation.guruId !== user.id && conversation.pjId !== user.id)) {
    return NextResponse.json({ error: "Percakapan tidak ditemukan." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data pesan tidak valid." }, { status: 400 });
  }
  const parsed = SendChatMessageSchema.omit({ recipientId: true }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Pesan tidak valid." }, { status: 400 });

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: { conversationId: parsedId.data, senderId: user.id, isi: parsed.data.isi },
      select: { id: true, isi: true, senderId: true, createdAt: true },
    });
    await tx.chatConversation.update({ where: { id: parsedId.data }, data: { updatedAt: new Date() } });
    return created;
  });
  return NextResponse.json({ message: { ...message, createdAt: message.createdAt.toISOString() } }, { status: 201 });
}
