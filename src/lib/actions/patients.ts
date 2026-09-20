"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

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
  revalidatePath("/pacientes");
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

  await prisma.patient.update({
    where: { id: patientId },
    data: { ...data, nome: data.nome },
  });
  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${patientId}`);
  return {};
}

export async function deletePatientAction(patientId: string) {
  await requireSession();
  await prisma.patient.delete({ where: { id: patientId } });
  revalidatePath("/pacientes");
  redirect("/pacientes");
}
