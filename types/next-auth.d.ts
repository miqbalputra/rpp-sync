// Augmentasi tipe NextAuth v5 agar session.user memiliki role, id, gender.
import { Role, Gender } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: Role;
      gender?: Gender | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    gender?: Gender | null;
  }
}