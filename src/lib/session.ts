import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";

export type SessionData = {
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
};

const secret = process.env.SESSION_SECRET;
if (!secret || secret.length < 32) {
  throw new Error(
    "SESSION_SECRET precisa ter pelo menos 32 caracteres. Defina em .env"
  );
}

export const sessionOptions: SessionOptions = {
  password: secret,
  cookieName: "fisiosono_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireSession(): Promise<IronSession<SessionData>> {
  const session = await getSession();
  if (!session.userId) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}
