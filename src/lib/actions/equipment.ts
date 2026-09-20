"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { EQUIPMENT_STATUS } from "@/lib/constants";

export type EquipmentFormState = { error?: string };

function parseDate(value: FormDataEntryValue | null): Date | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

function parseEquipmentForm(formData: FormData) {
  const numeroSerie = String(formData.get("numeroSerie") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const obs = String(formData.get("obs") ?? "").trim() || null;
  const manutencaoHorasRaw = String(formData.get("manutencaoHoras") ?? "").trim();
  const manutencaoHoras = manutencaoHorasRaw ? Number(manutencaoHorasRaw) : null;
  const tipoManutencao = String(formData.get("tipoManutencao") ?? "").trim() || null;
  const dataManutencao = parseDate(formData.get("dataManutencao"));
  const status = String(formData.get("status") ?? "DISPONIVEL");

  return { numeroSerie, tipo, obs, manutencaoHoras, tipoManutencao, dataManutencao, status };
}

export async function createEquipmentAction(
  _prevState: EquipmentFormState,
  formData: FormData
): Promise<EquipmentFormState> {
  await requireSession();
  const data = parseEquipmentForm(formData);

  if (!data.numeroSerie || !data.tipo) {
    return { error: "Informe ao menos o número de série e o tipo do equipamento." };
  }
  if (!EQUIPMENT_STATUS.includes(data.status as never)) {
    return { error: "Status inválido." };
  }

  const existing = await prisma.equipment.findUnique({
    where: { numeroSerie: data.numeroSerie },
  });
  if (existing) {
    return { error: "Já existe um equipamento com esse número de série." };
  }

  const equipment = await prisma.equipment.create({ data });
  revalidatePath("/equipamentos");
  redirect(`/equipamentos/${equipment.id}`);
}

export async function updateEquipmentAction(
  equipmentId: string,
  _prevState: EquipmentFormState,
  formData: FormData
): Promise<EquipmentFormState> {
  await requireSession();
  const data = parseEquipmentForm(formData);

  if (!data.numeroSerie || !data.tipo) {
    return { error: "Informe ao menos o número de série e o tipo do equipamento." };
  }

  const conflict = await prisma.equipment.findFirst({
    where: { numeroSerie: data.numeroSerie, NOT: { id: equipmentId } },
  });
  if (conflict) {
    return { error: "Já existe outro equipamento com esse número de série." };
  }

  await prisma.equipment.update({ where: { id: equipmentId }, data });
  revalidatePath("/equipamentos");
  revalidatePath(`/equipamentos/${equipmentId}`);
  return {};
}

export async function deleteEquipmentAction(equipmentId: string) {
  await requireSession();
  await prisma.patient.updateMany({
    where: { equipmentId },
    data: { equipmentId: null },
  });
  await prisma.equipment.delete({ where: { id: equipmentId } });
  revalidatePath("/equipamentos");
  redirect("/equipamentos");
}
