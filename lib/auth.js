import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const client = await clientPromise;
        const db = client.db();

        const user = await db
          .collection("users")
          .findOne({ email: credentials.email });

        if (!user) {
          throw new Error("No user found with this email");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Invalid password");
        }

        // ⚠️ BOHOT ZAROORI: Yahan wo saara data return karein jo aap token mein chahte hain
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || null,
          plan: user.plan || "FREE",
          paymentStatus: user.paymentStatus || "pending",
          limits: user.limits || { extractions: 0, filters: 0, fields: 0 },
          extractionsUsed: user.extractionsUsed || 0,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Login ke waqt data token mein save karna
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
        token.paymentStatus = user.paymentStatus;
        token.limits = user.limits;
        token.extractionsUsed = user.extractionsUsed;
      }

      // Agar user login hai, to har baar DB se fresh data check karein (taake payment hote hi session update ho jaye)
      if (!user && token?.email) {
        const client = await clientPromise;
        const db = client.db();
        const dbUser = await db.collection("users").findOne({ email: token.email });
        
        if (dbUser) {
          token.plan = dbUser.plan;
          token.paymentStatus = dbUser.paymentStatus;
          token.limits = dbUser.limits;
          token.extractionsUsed = dbUser.extractionsUsed || 0;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.plan = token.plan;
        session.user.paymentStatus = token.paymentStatus;
        session.user.limits = token.limits;
        session.user.extractionsUsed = token.extractionsUsed;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth",
    error: "/auth",
  },

  secret: process.env.NEXTAUTH_SECRET,
};