import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import AdminProfile from '@/models/AdminProfile';

const authOptions = {
  providers: [
    // Admin — single account, credentials live in .env.local, never in the DB.
    // The display name, however, IS stored in the DB (AdminProfile) so it
    // can be changed from Settings without touching env vars.
    CredentialsProvider({
      id: 'admin',
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = credentials;
        if (email !== process.env.ADMIN_EMAIL) return null;

        const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
        if (!valid) return null;

        await connectDB();
        const profile = await AdminProfile.findOneAndUpdate(
          { key: 'singleton' },
          {},
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return { id: 'admin', name: profile.name, email, role: 'admin' };
      },
    }),

    // Viewer — regular accounts, stored in MongoDB, created via /signup.
    CredentialsProvider({
      id: 'user',
      name: 'User Login',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = credentials;

        await connectDB();
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user._id.toString(), name: user.name, email: user.email, role: 'user' };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.id = token.id;

      // Always pull the latest profile data from the DB rather than
      // trusting the JWT's cached value — this way a name/photo change
      // in Settings takes effect immediately, no re-login needed.
      await connectDB();
      if (token.role === 'admin') {
        const profile = await AdminProfile.findOne({ key: 'singleton' }).lean();
        session.user.name = profile?.name || 'Admin';
      } else {
        const dbUser = await User.findById(token.id).lean();
        session.user.name = dbUser?.name || token.name;
        session.user.avatarUrl = dbUser?.avatarUrl || null;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST, authOptions };
