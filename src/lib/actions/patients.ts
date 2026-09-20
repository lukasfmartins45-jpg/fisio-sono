"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  syncEquipmentAssignment,
  syncEquipmentOnRentalToggle,
} from "@/lib/equipment-status";

export type PatientFormState = { error?: string };

function parseDate(value: FormDataEntryValue | null): Date | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

function text(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

function parsePatientForm(formData: FormData) {
  const nome = text(formData, "nome");
  const equipmentId = text(formData, "equipmentId");
  return {
    nome,
    cidade: text(formData, "cidade"),
    inicioLocacao: parseDate(formData.get("inicioLocacao")),
    fimLocacao: parseDate(formData.get("fimLocacao")),
    aparelhoLocado: text(formData, "aparelhoLocado"),
    identificacaoAparelho: text(formData, "identificacaoAparelho"),
    adesaoTerapia: text(formData, "adesaoTerapia"),
    compraCpap: text(formData, "compraCpap"),
    dataEntregaEquipamento: parseDate(formData.get("dataEntregaEquipamento")),
    dispositivo: text(formData, "dispositivo"),
    nsAparelhoEntregue: text(formData, "nsAparelhoEntregue"),
    observacoes: text(formData, "observacoes"),
    equipmentId: equipmentId || null,
  };
}

export async function createPatientAction(
  _prevState: PatientFormState,
  formData: FormData
): Promise<PatientFormState> {
  await requireSession();
  const data = parsePatientForm(formData);

  if (!data.nome) {
    return { error: "Informe o nome do paciente." };
  }

  const patient = await prisma.patient.create({ data: { ...data, nome: data.nome } });
  await syncEquipmentAssignment(patient.id, null, data.equipmentId);
  revalidatePath("/pacientes");
  revalidatePath("/equipamentos");
  redirect(`/pacientes/${patient.id}`);
}

export async function updatePatientAction(
  patientId: string,
  _prevState: PatientFormState,
  formData: FormData
): Promise<PatientFormState> {
  await requireSession();
  const data = parsePatientForm(formData);

  if (!data.nome) {
    return { error: "Informe o nome do paciente." };
  }

  const before = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { equipmentId: true, fimLocacao: true },
  });

  await prisma.patient.update({
    where: { id: patientId },
    data: { ...data, nome: data.nome },
  });

  const equipmentChanged = (before?.equipmentId ?? null) !== data.equipmentId;
  if (equipmentChanged) {
    await syncEquipmentAssignment(patientId, before?.equipmentId ?? null, data.equipmentId);
  } else {
    // Mesmo equipamento: se só o "Fim da locação" mudou, mantém o status do
    // equipamento coerente (finaliza libera, reabrir volta a ocupar).
    await syncEquipmentOnRentalToggle(
      patientId,
      data.equipmentId,
      !before?.fimLocacao,
      !data.fimLocacao,
      data.fimLocacao
    );
  }

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${patientId}`);
  revalidatePath("/equipamentos");
  return {};
}

export async function deletePatientAction(patientId: string) {
  await requireSession();
  await prisma.patient.delete({ where: { id: patientId } });
  revalidatePath("/pacientes");
  redirect("/pacientes");
}
