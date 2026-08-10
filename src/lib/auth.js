import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Category, { DEFAULT_CATEGORIES } from '@/models/Category';
import PaymentMethod, { DEFAULT_PAYMENT_METHODS } from '@/models/PaymentMethod';

// Creates the default category/payment-method set for a brand new user so
// they can start adding expenses immediately.
async function seedDefaultsForUser(userId) {
  const existingCategories = await Category.countDocuments({ userId });
  if (existingCategories === 0) {
    await Category.insertMany(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, userId, isDefault: true }))
    );
  }
  const existingMethods = await PaymentMethod.countDocuments({ userId });
  if (existingMethods === 0) {
    await PaymentMethod.insertMany(
      DEFAULT_PAYMENT_METHODS.map((name) => ({ name, userId, isDefault: true }))
    );
  }
}

export const authOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required.');
        }
        await connectDB();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password.');
        }
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          throw new Error('Invalid email or password.');
        }
        return { id: user._id.toString(), name: user.name, email: user.email };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      await connectDB();
      if (account?.provider === 'google') {
        let dbUser = await User.findOne({ email: user.email.toLowerCase() });
        if (!dbUser) {
          dbUser = await User.create({ name: user.name, email: user.email.toLowerCase() });
        }
        await seedDefaultsForUser(dbUser._id);
        user.id = dbUser._id.toString();
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.userId;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export { seedDefaultsForUser };
