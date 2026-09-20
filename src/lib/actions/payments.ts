"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { PAYMENT_STATUS, RENTAL_STATUS } from "@/lib/constants";

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

  const period = await prisma.rentalPeriod.update({
    where: { id: rentalPeriodId },
    data: { status },
    include: { patient: true },
  });

  const equipmentId = period.patient.equipmentId;
  if (equipmentId) {
    if (status === "FINALIZADO") {
      // Locação encerrada: libera o equipamento no inventário.
      await prisma.equipment.update({
        where: { id: equipmentId },
        data: { status: "DISPONIVEL" },
      });
    } else if (status === "EM_LOCACAO") {
      // Volta a ficar em locação, só se ainda estava marcado como disponível
      // (não sobrescreve "vendido" ou "em manutenção").
      await prisma.equipment.updateMany({
        where: { id: equipmentId, status: "DISPONIVEL" },
        data: { status: "EM_LOCACAO" },
      });
    }
    revalidatePath("/equipamentos");
    revalidatePath(`/equipamentos/${equipmentId}`);
  }

  revalidatePath("/pagamentos");
  revalidatePath(`/pacientes/${period.patientId}`);
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
