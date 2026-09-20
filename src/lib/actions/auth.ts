"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";

export type LoginState = { error?: string; email?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha.", email };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "E-mail ou senha inválidos.", email };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "E-mail ou senha inválidos.", email };
  }

  const session = await getSession();
  session.userId = user.id;
  session.name = user.name;
  session.email = user.email;
  session.role = user.role;
  await session.save();

  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
