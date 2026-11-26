"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  syncEquipmentAssignment,
  syncEquipmentOnRentalToggle,
} from "@/lib/equipment-status";
import { ensureInitialPaymentsForNewPatient } from "@/lib/actions/payments";

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
    cpf: text(formData, "cpf"),
    rg: text(formData, "rg"),
    telefone: text(formData, "telefone"),
    endereco: text(formData, "endereco"),
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

async function registerMaterialHandout(patientId: string, formData: FormData) {
  const mascaraStockItemId = text(formData, "mascaraStockItemId");
  const entregouTubo = formData.get("entregouTubo") === "1";
  const cpapVendaTipo = text(formData, "cpapVendaTipo");
  const cpapVendaModelo = text(formData, "cpapVendaModelo");

  const saidas: { stockItemId: string; quantidade: number; motivo: string }[] = [];

  if (mascaraStockItemId) {
    saidas.push({
      stockItemId: mascaraStockItemId,
      quantidade: 1,
      motivo: "Entregue no cadastro do paciente",
    });
  }

  if (entregouTubo) {
    const tubo = await prisma.stockItem.findFirst({ where: { categoria: "TUBO" } });
    if (tubo) {
      saidas.push({
        stockItemId: tubo.id,
        quantidade: 1,
        motivo: "Entregue no cadastro do paciente",
      });
    }
  }

  if (cpapVendaTipo && cpapVendaTipo !== "NENHUM" && cpapVendaModelo) {
    const categoria = cpapVendaTipo === "NOVO" ? "CPAP_NOVO" : "CPAP_USADO";
    const item = await prisma.stockItem.findUnique({
      where: { categoria_nome: { categoria, nome: cpapVendaModelo } },
    });
    if (item) {
      saidas.push({
        stockItemId: item.id,
        quantidade: 1,
        motivo: `Venda de CPAP ${cpapVendaTipo === "NOVO" ? "novo" : "usado"} no cadastro`,
      });
    }
  }

  for (const saida of saidas) {
    await prisma.$transaction([
      prisma.stockItem.update({
        where: { id: saida.stockItemId },
        data: { quantidade: { decrement: saida.quantidade } },
      }),
      prisma.stockMovement.create({
        data: {
          stockItemId: saida.stockItemId,
          tipo: "SAIDA",
          quantidade: saida.quantidade,
          motivo: saida.motivo,
          patientId,
        },
      }),
    ]);
  }
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
  await ensureInitialPaymentsForNewPatient(patient.id, data.inicioLocacao ?? new Date());
  await registerMaterialHandout(patient.id, formData);
  revalidatePath("/pacientes");
  revalidatePath("/equipamentos");
  revalidatePath("/estoque");
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
  const wasActive = !before?.fimLocacao;
  const isActive = !data.fimLocacao;

  if (equipmentChanged) {
    await syncEquipmentAssignment(patientId, before?.equipmentId ?? null, data.equipmentId);
  } else if (wasActive !== isActive) {
    // Mesmo equipamento: se só o "Fim da locação" mudou, mantém o status do
    // equipamento coerente (finaliza libera, reabrir volta a ocupar).
    await syncEquipmentOnRentalToggle(
      patientId,
      data.equipmentId,
      wasActive,
      isActive,
      data.fimLocacao
    );
  }

  // Mantém a "Situação" na aba Pagamentos do ano corrente coerente com o
  // "Fim da locação" marcado aqui.
  if (wasActive !== isActive) {
    const currentYear = new Date().getFullYear();
    const currentPeriod = await prisma.rentalPeriod.findUnique({
      where: { patientId_ano: { patientId, ano: currentYear } },
    });
    const newStatus = isActive ? "EM_LOCACAO" : "FINALIZADO";
    if (currentPeriod && currentPeriod.status !== newStatus) {
      await prisma.rentalPeriod.update({
        where: { id: currentPeriod.id },
        data: { status: newStatus },
      });
      revalidatePath("/pagamentos");
    }
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
