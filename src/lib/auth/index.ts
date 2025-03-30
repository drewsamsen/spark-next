import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import EmailProvider from "next-auth/providers/email";

export enum UserRole {
  user = "user",
  admin = "admin",
}

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth/adapters" {
  interface AdapterUser {
    login?: string;
    role?: UserRole;
    dashboardEnabled?: boolean;
    isTeamAdmin?: boolean;
  }
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      login?: string;
      role?: UserRole;
      dashboardEnabled?: boolean;
      isAdmin?: boolean;
      expires?: string;
      isTeamAdmin?: boolean;
    };
    accessToken?: string;
  }

  export interface Profile {
    login: string;
  }

  interface User {
    role?: UserRole;
    login?: string;
    expires?: string;
    isTeamAdmin?: boolean;
    isAdmin?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  // We'll replace the Prisma adapter with Supabase later
  // For now, comment it out to prevent errors
  // adapter: SupabaseAdapter({
  //   url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  //   secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
  // }),
  providers: [
    EmailProvider({
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    }),
  ],
  session: {
    strategy: "jwt", // Changed from "database" to "jwt" since we removed the adapter
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      try {
        const email = user?.email;
        if (!email) return false;

        /*
        // Enable this to restrict sign-ins to certain domains or allowlist
        const domainCheck = ALLOWED_DOMAINS.some((d) => email.endsWith(d));
        if (!domainCheck) {
          // We'll implement this check with Supabase later
          // const inAllowlist = await checkAllowlist(email);
          // if (!inAllowlist) {
          //   return false;
          // }
        }
        */

        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
    async session({ session, token }) {
      try {
        // With JWT strategy, we get the token instead of user
        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub as string,
            // We'll add more user properties here when we implement Supabase auth
          },
        };
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
    async jwt({ token, user }) {
      // Include user data in the token when it's available
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.login = user.login;
        token.isAdmin = user.isAdmin;
      }
      return token;
    }
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },
};

export const getServerAuthSession = () => getServerSession(authOptions);
