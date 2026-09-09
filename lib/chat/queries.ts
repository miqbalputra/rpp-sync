import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

export const CHAT_ROLES = new Set<Role>([Role.GURU, Role.PJ_DINIYYAH]);

export function isChatRole(role: Role): role is "GURU" | "PJ_DINIYYAH" {
  return CHAT_ROLES.has(role);
}

export async function getActiveChatUser(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, aktif: true, deletedAt: null },
    select: { id: true, nama: true, role: true },
  });
}

export async function getChatContacts(userId: string, role: Role) {
  if (role === Role.GURU) {
    return prisma.user.findMany({
      where: {
        id: { not: userId },
        role: Role.PJ_DINIYYAH,
        aktif: true,
        deletedAt: null,
      },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, role: true },
    });
  }

  return prisma.user.findMany({
    where: {
      id: { not: userId },
      role: Role.GURU,
      aktif: true,
      deletedAt: null,
      guru: { deletedAt: null },
    },
    orderBy: { nama: "asc" },
    select: { id: true, nama: true, role: true },
  });
}

export async function getChatConversations(userId: string, role: Role) {
  const conversations = await prisma.chatConversation.findMany({
    where:
      role === Role.GURU
        ? { guruId: userId, pj: { aktif: true, deletedAt: null } }
        : { pjId: userId, guru: { aktif: true, deletedAt: null, guru: { deletedAt: null } } },
    orderBy: { updatedAt: "desc" },
    include: {
      guru: { select: { id: true, nama: true, role: true } },
      pj: { select: { id: true, nama: true, role: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { isi: true, createdAt: true, senderId: true, deletedAt: true },
      },
      _count: {
        select: {
          messages: { where: { senderId: { not: userId }, readAt: null, deletedAt: null } },
        },
      },
    },
  });

  return conversations.map((conversation) => {
    const participant = role === Role.GURU ? conversation.pj : conversation.guru;
    const lastMessage = conversation.messages[0] ?? null;
    return {
      id: conversation.id,
      participant,
      lastMessage: lastMessage
        ? {
            isi: lastMessage.deletedAt ? "Pesan ini telah dihapus" : lastMessage.isi,
            createdAt: lastMessage.createdAt.toISOString(),
            senderId: lastMessage.senderId,
            deletedAt: lastMessage.deletedAt?.toISOString() ?? null,
          }
        : null,
      unreadCount: conversation._count.messages,
      updatedAt: conversation.updatedAt.toISOString(),
    };
  });
}

export async function getChatConversationForUser(conversationId: string, userId: string) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      guru: { select: { id: true, nama: true, role: true } },
      pj: { select: { id: true, nama: true, role: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
        include: { sender: { select: { id: true, nama: true, role: true } } },
      },
    },
  });

  if (!conversation || (conversation.guruId !== userId && conversation.pjId !== userId)) return null;

  return {
    id: conversation.id,
    guru: conversation.guru,
    pj: conversation.pj,
    messages: conversation.messages.map((message) => ({
      id: message.id,
      isi: message.deletedAt ? "Pesan ini telah dihapus" : message.isi,
      senderId: message.senderId,
      createdAt: message.createdAt.toISOString(),
      readAt: message.readAt?.toISOString() ?? null,
      deletedAt: message.deletedAt?.toISOString() ?? null,
      sender: message.sender,
    })),
  };
}

export async function markChatConversationRead(conversationId: string, userId: string) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: { guruId: true, pjId: true },
  });
  if (!conversation || (conversation.guruId !== userId && conversation.pjId !== userId)) return false;

  await prisma.chatMessage.updateMany({
    where: { conversationId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });
  return true;
}
