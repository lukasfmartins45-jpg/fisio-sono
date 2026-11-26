"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { STOCK_CATEGORIAS } from "@/lib/constants";

export type StockFormState = { error?: string; success?: string };

export async function createStockItemAction(
  _prevState: StockFormState,
  formData: FormData
): Promise<StockFormState> {
  await requireSession();

  const categoria = String(formData.get("categoria") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const marca = String(formData.get("marca") ?? "").trim() || null;

  if (!STOCK_CATEGORIAS.includes(categoria as never)) {
    return { error: "Categoria inválida." };
  }
  if (!nome) {
    return { error: "Informe o nome do material." };
  }

  const existing = await prisma.stockItem.findUnique({
    where: { categoria_nome: { categoria, nome } },
  });
  if (existing) {
    return { error: "Já existe um material com esse nome nessa categoria." };
  }

  await prisma.stockItem.create({ data: { categoria, nome, marca } });
  revalidatePath("/estoque");
  return { success: "Material adicionado ao catálogo." };
}

export async function registerStockEntryAction(
  _prevState: StockFormState,
  formData: FormData
): Promise<StockFormState> {
  await requireSession();

  const stockItemId = String(formData.get("stockItemId") ?? "");
  const quantidade = Number(formData.get("quantidade"));
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  if (!stockItemId) return { error: "Selecione o material." };
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    return { error: "Informe uma quantidade válida." };
  }

  await prisma.$transaction([
    prisma.stockItem.update({
      where: { id: stockItemId },
      data: { quantidade: { increment: quantidade } },
    }),
    prisma.stockMovement.create({
      data: { stockItemId, tipo: "ENTRADA", quantidade, motivo },
    }),
  ]);

  revalidatePath("/estoque");
  return { success: "Entrada registrada." };
}

export async function registerStockSaleAction(
  _prevState: StockFormState,
  formData: FormData
): Promise<StockFormState> {
  await requireSession();

  const stockItemId = String(formData.get("stockItemId") ?? "");
  const quantidade = Number(formData.get("quantidade"));
  const motivo = String(formData.get("motivo") ?? "").trim() || null;
  let patientId = String(formData.get("patientId") ?? "").trim() || null;
  const patientNome = String(formData.get("patientNome") ?? "").trim();

  if (!stockItemId) return { error: "Selecione o material." };
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    return { error: "Informe uma quantidade válida." };
  }

  if (!patientId && patientNome) {
    const patient = await prisma.patient.findFirst({ where: { nome: patientNome } });
    if (!patient) {
      return {
        error:
          "Paciente não encontrado. Escolha um nome da lista sugerida, ou deixe em branco.",
      };
    }
    patientId = patient.id;
  }

  await prisma.$transaction([
    prisma.stockItem.update({
      where: { id: stockItemId },
      data: { quantidade: { decrement: quantidade } },
    }),
    prisma.stockMovement.create({
      data: { stockItemId, tipo: "SAIDA", quantidade, motivo, patientId },
    }),
  ]);

  revalidatePath("/estoque");
  if (patientId) revalidatePath(`/pacientes/${patientId}`);
  return { success: "Saída registrada." };
}
