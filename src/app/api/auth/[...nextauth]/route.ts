import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { verifyOtp } from '@/lib/otp';
import { Role } from '@prisma/client';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & OTP / Password Login',
      credentials: {
        email: { label: 'Email Address', type: 'email', placeholder: 'name@example.com' },
        password: { label: 'Password', type: 'password' },
        otp: { label: 'OTP Code', type: 'text' },
        role: { label: 'Requested Role', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error('Please enter your email address');
        }

        const cleanEmail = credentials.email.trim().toLowerCase();
        const reqRole = ((credentials.role || 'PARENT').toUpperCase()) as Role;
        const otp = credentials.otp ? credentials.otp.trim() : null;
        const password = credentials.password ? credentials.password.trim() : null;

        // Require at least one authentication credential
        if (!otp && !password) {
          throw new Error('Please enter your password or request an Email OTP verification code.');
        }

        // Platform Administrators must strictly authenticate via password
        if (reqRole === 'ADMIN' && otp) {
          throw new Error('OTP authentication is disabled for Platform Administrators. Please sign in with your password.');
        }

        // If OTP is provided, verify it first
        if (otp) {
          const otpResult = verifyOtp(cleanEmail, otp);
          if (!otpResult.valid) {
            throw new Error(otpResult.error || 'Invalid or expired OTP code');
          }
        }

        // If trying to access as ADMIN, verify admin eligibility
        const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const isStandardAdmin = Boolean(configuredAdminEmail && cleanEmail === configuredAdminEmail);

        if (reqRole === 'ADMIN' && !isStandardAdmin) {
          // Check DB user role
          try {
            const adminCheck = await prisma.user.findFirst({
              where: { OR: [{ email: cleanEmail }, { phone: cleanEmail }] },
              select: { role: true },
            });

            if (!adminCheck || adminCheck.role !== Role.ADMIN) {
              throw new Error('Access denied: this portal is strictly restricted to Platform Administrators.');
            }
          } catch (err: any) {
            if (err?.message?.includes('Access denied')) {
              throw err;
            }
            console.error('[DB_ERROR] Failed to verify admin user:', err);
            throw new Error('Database error: Unable to verify administrator credentials.');
          }
        }

        try {
          // Look up user in PostgreSQL via Prisma
          let dbUser = await prisma.user.findFirst({
            where: {
              OR: [
                { email: { equals: cleanEmail, mode: 'insensitive' } },
                { phone: cleanEmail },
              ],
            },
            include: {
              parentProfile: true,
              coachingCentre: true,
            },
          });

          // Bootstrap primary admin user if not found in database using environment credentials
          if (!dbUser && isStandardAdmin) {
            const defaultAdminPass = process.env.ADMIN_INITIAL_PASSWORD;
            if (!defaultAdminPass) {
              throw new Error('Initial admin password is not configured in environment.');
            }
            if (!otp && password && password !== defaultAdminPass) {
              throw new Error('Incorrect password. Please verify your credentials.');
            }
            const hashedAdminPass = await bcrypt.hash(defaultAdminPass, 12);
            try {
              dbUser = await prisma.user.create({
                data: {
                  id: `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
                  email: cleanEmail,
                  phone: process.env.ADMIN_PHONE || '+91 97625 77714',
                  role: Role.ADMIN,
                  passwordHash: hashedAdminPass,
                  isActive: true,
                },
                include: {
                  parentProfile: true,
                  coachingCentre: true,
                },
              });
            } catch (err: any) {
              console.error('[DB_ERROR] Failed to bootstrap initial admin user:', err);
              throw new Error('Database error: Failed to provision administrator account.');
            }
          }

          if (dbUser) {
            // Verify password if OTP was not provided
            if (!otp && password) {
              if (!dbUser.passwordHash) {
                throw new Error('This account does not have a password configured. Please sign in using Email OTP.');
              }

              const isBcrypt = dbUser.passwordHash.startsWith('$2a$') || dbUser.passwordHash.startsWith('$2b$');
              let isPassValid = false;

              if (isBcrypt) {
                isPassValid = await bcrypt.compare(password, dbUser.passwordHash);
              } else {
                // Exact equality check for legacy plaintext passwords, then upgrade to bcrypt
                isPassValid = dbUser.passwordHash === password;
                if (isPassValid) {
                  const upgradedHash = await bcrypt.hash(password, 12);
                  await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { passwordHash: upgradedHash },
                  }).catch(() => null);
                }
              }

              if (!isPassValid) {
                throw new Error('Incorrect password. Please verify your credentials or use Email OTP.');
              }
            }

            // Role guard for Admin portal
            if (reqRole === 'ADMIN' && dbUser.role !== Role.ADMIN) {
              throw new Error('Access denied: account does not have Platform Administrator privileges.');
            }

            const locality = dbUser.parentProfile?.locality || dbUser.coachingCentre?.locality || 'Kamla Nagar';
            const city = dbUser.parentProfile?.city || 'Agra';
            const address = dbUser.coachingCentre?.address || '';
            const lat = dbUser.coachingCentre?.latitude ?? undefined;
            const lon = dbUser.coachingCentre?.longitude ?? undefined;

            return {
              id: dbUser.id,
              userId: dbUser.id,
              name: dbUser.parentProfile?.fullName || dbUser.coachingCentre?.name || (isStandardAdmin ? (process.env.ADMIN_NAME || 'Platform Administrator') : 'KnowUrCoach User'),
              email: dbUser.email || cleanEmail,
              phone: dbUser.phone,
              role: dbUser.role,
              locality,
              city,
              address,
              lat,
              lon,
            };
          }

          // If user is not found in DB, reject authentication
          throw new Error('No registered account found with this email. Please sign up or register first.');
        } catch (error: any) {
          if (error?.message && !error.message.includes('Prisma')) {
            throw error;
          }
          console.error('[AUTH_ERROR] NextAuth authorize error:', error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days persistent session for smooth user experience
    updateAge: 24 * 60 * 60,   // Rolling refresh: renew token timestamp every 24 hours of active use
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.userId = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        token.phone = (user as any).phone;
        token.locality = (user as any).locality;
        token.city = (user as any).city;
        token.address = (user as any).address;
        token.lat = (user as any).lat;
        token.lon = (user as any).lon;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.userId || token.id) as string;
        session.user.userId = (token.userId || token.id) as string;
        session.user.role = (token.role || 'PARENT') as Role;
        session.user.email = (token.email as string) || session.user.email;
        session.user.name = (token.name as string) || session.user.name;
        session.user.phone = token.phone as string | undefined;
        session.user.locality = token.locality as string | undefined;
        session.user.city = token.city as string | undefined;
        session.user.address = token.address as string | undefined;
        session.user.lat = token.lat as number | undefined;
        session.user.lon = token.lon as number | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/register-parent',
  },
  secret: process.env.NEXTAUTH_SECRET || 'knowurcoach-secret-key-agra-2026',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
