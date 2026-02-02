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

        // --- 1. CHECK STATUS (For Credentials Login) ---
        if (user.status === "deactive") {
          throw new Error("Your account is deactive. Please contact admin.");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          status: user.status,
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
    // --- 2. SIGN IN CALLBACK (For Google & All Providers) ---
    async signIn({ user, account, profile }) {
      // Agar user Google se login kar raha hai, to DB check lazmi hai
      if (account.provider === "google") {
        const client = await clientPromise;
        const db = client.db();
        const dbUser = await db.collection("users").findOne({ email: user.email });
        
        // Agar user exist karta hai aur deactive hai to login roko
        if (dbUser && dbUser.status === "deactive") {
          throw new Error("Your account is deactive. Please contact admin.");
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
        token.status = user.status;
        token.role = user.role;
        token.paymentStatus = user.paymentStatus;
        token.limits = user.limits;
        token.extractionsUsed = user.extractionsUsed;
      }

      if (!user && token?.email) {
        const client = await clientPromise;
        const db = client.db();
        const dbUser = await db.collection("users").findOne({ email: token.email });
        
        if (dbUser) {
          token.plan = dbUser.plan;
          token.paymentStatus = dbUser.paymentStatus;
          token.limits = dbUser.limits;
          token.extractionsUsed = dbUser.extractionsUsed || 0;
          token.role = dbUser.role;
          token.status = dbUser.status;

          // --- 3. AUTO LOGOUT IF DEACTIVATED WHILE IN SESSION ---
          if (dbUser.status === "deactive") {
             // Hum token ko expire nahi kar sakte yahan se direct, 
             // magar status session mein pass ho jayega aur aap frontend par handle kar sakte hain.
          }
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
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth",
    error: "/auth", // Error hone par isi page par message jayega
  },

  secret: process.env.NEXTAUTH_SECRET,
};