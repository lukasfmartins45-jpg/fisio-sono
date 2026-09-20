"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { PAYMENT_STATUS, RENTAL_STATUS } from "@/lib/constants";
import { syncEquipmentOnRentalToggle } from "@/lib/equipment-status";

export async function addPatientToYearAction(patientId: string, ano: number) {
  await requireSession();

  const existing = await prisma.rentalPeriod.findUnique({
    where: { patientId_ano: { patientId, ano } },
  });
  if (existing) return existing;

  const rentalPeriod = await prisma.rentalPeriod.create({
    data: {
      patientId,
      ano,
      status: "EM_LOCACAO",
      payments: {
        create: Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, status: null })),
      },
    },
  });

  revalidatePath("/pagamentos");
  revalidatePath(`/pacientes/${patientId}`);
  return rentalPeriod;
}

export async function removeRentalPeriodAction(rentalPeriodId: string) {
  await requireSession();
  const period = await prisma.rentalPeriod.delete({
    where: { id: rentalPeriodId },
  });
  revalidatePath("/pagamentos");
  revalidatePath(`/pacientes/${period.patientId}`);
}

export async function setMonthlyPaymentAction(
  rentalPeriodId: string,
  mes: number,
  status: string
) {
  await requireSession();

  const value = PAYMENT_STATUS.includes(status as never) ? status : null;

  await prisma.monthlyPayment.upsert({
    where: { rentalPeriodId_mes: { rentalPeriodId, mes } },
    update: { status: value },
    create: { rentalPeriodId, mes, status: value },
  });

  const period = await prisma.rentalPeriod.findUnique({
    where: { id: rentalPeriodId },
  });
  revalidatePath("/pagamentos");
  if (period) revalidatePath(`/pacientes/${period.patientId}`);
}

export async function setRentalStatusAction(
  rentalPeriodId: string,
  status: string
) {
  await requireSession();
  if (!RENTAL_STATUS.includes(status as never)) return;

  const before = await prisma.rentalPeriod.findUnique({
    where: { id: rentalPeriodId },
    include: { patient: true },
  });
  if (!before) return;

  const wasActive = before.status === "EM_LOCACAO";
  const isActive = status === "EM_LOCACAO";

  await prisma.rentalPeriod.update({
    where: { id: rentalPeriodId },
    data: { status },
  });

  const equipmentId = before.patient.equipmentId;
  if (equipmentId && wasActive !== isActive) {
    await syncEquipmentOnRentalToggle(
      before.patientId,
      equipmentId,
      wasActive,
      isActive,
      isActive ? null : new Date()
    );
    revalidatePath("/equipamentos");
    revalidatePath(`/equipamentos/${equipmentId}`);
  }

  // Mantém o "Fim da locação" do cadastro do paciente coerente com a
  // situação marcada aqui, mas só considerando o ano corrente.
  const currentYear = new Date().getFullYear();
  if (before.ano === currentYear && wasActive !== isActive) {
    if (!isActive && !before.patient.fimLocacao) {
      await prisma.patient.update({
        where: { id: before.patientId },
        data: { fimLocacao: new Date() },
      });
    } else if (isActive && before.patient.fimLocacao) {
      await prisma.patient.update({
        where: { id: before.patientId },
        data: { fimLocacao: null },
      });
    }
  }

  revalidatePath("/pagamentos");
  revalidatePath(`/pacientes/${before.patientId}`);
}

export async function updatePriceAction(ano: number, valor: number) {
  await requireSession();
  await prisma.priceTable.upsert({
    where: { ano },
    update: { valor },
    create: { ano, valor },
  });
  revalidatePath("/pagamentos");
  revalidatePath("/dashboard");
}
