"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { reminderMessageParams } from "@/lib/cobrancas";

export async function sendReminderAction(monthlyPaymentId: string) {
  await requireSession();

  const payment = await prisma.monthlyPayment.findUnique({
    where: { id: monthlyPaymentId },
    include: { rentalPeriod: { include: { patient: true } } },
  });

  if (!payment) {
    return { error: "Pagamento não encontrado." };
  }
  const telefone = payment.rentalPeriod.patient.telefone;
  if (!telefone) {
    return {
      error: "Esse paciente não tem WhatsApp cadastrado. Edite o cadastro dele antes.",
    };
  }

  const result = await sendWhatsAppTemplate(
    telefone,
    reminderMessageParams(
      payment.rentalPeriod.patient.nome,
      payment.mes,
      payment.rentalPeriod.ano
    )
  );

  if (!result.ok) {
    return { error: result.error };
  }

  await prisma.monthlyPayment.update({
    where: { id: monthlyPaymentId },
    data: { lembreteEnviadoEm: new Date() },
  });
  revalidatePath("/cobrancas");
  return { success: "Lembrete enviado pelo WhatsApp." };
}
