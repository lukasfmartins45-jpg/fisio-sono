"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";

async function requireAdmin() {
  const session = await getSession();
  if (!session.userId || session.role !== "ADMIN") {
    throw new Error("Apenas administradores podem gerenciar usuários.");
  }
  return session;
}

export type UserFormState = { error?: string; success?: string };

export async function createUserAction(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "USER");

  if (!name || !email || password.length < 6) {
    return {
      error: "Preencha nome, e-mail e uma senha com pelo menos 6 caracteres.",
    };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe um usuário com esse e-mail." };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { name, email, passwordHash, role: role === "ADMIN" ? "ADMIN" : "USER" },
  });

  revalidatePath("/configuracoes");
  return { success: "Usuário criado com sucesso." };
}

export async function deleteUserAction(userId: string) {
  const session = await requireAdmin();
  if (session.userId === userId) {
    throw new Error("Você não pode excluir seu próprio usuário.");
  }
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/configuracoes");
}

export async function changePasswordAction(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await getSession();
  if (!session.userId) {
    return { error: "Sessão expirada." };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (newPassword.length < 6) {
    return { error: "A nova senha precisa ter pelo menos 6 caracteres." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return { error: "Usuário não encontrado." };
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Senha atual incorreta." };
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: "Senha alterada com sucesso." };
}
