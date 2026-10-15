import { Role } from '@prisma/client';
import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      userId: string;
      role: Role;
      phone?: string;
      locality?: string;
      city?: string;
      address?: string;
      lat?: number;
      lon?: number;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    userId?: string;
    role: Role;
    phone?: string;
    locality?: string;
    city?: string;
    address?: string;
    lat?: number;
    lon?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    userId?: string;
    role?: Role;
    phone?: string;
    locality?: string;
    city?: string;
    address?: string;
    lat?: number;
    lon?: number;
  }
}
