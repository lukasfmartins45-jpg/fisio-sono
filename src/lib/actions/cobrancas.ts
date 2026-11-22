"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { listPendingByPatient, reminderMessageParams } from "@/lib/cobrancas";

export async function sendReminderAction(patientId: string) {
  await requireSession();

  const groups = await listPendingByPatient();
  const group = groups.find((g) => g.patientId === patientId);

  if (!group) {
    return { error: "Nenhuma pendência encontrada para este paciente." };
  }
  if (!group.telefone) {
    return {
      error: "Esse paciente não tem WhatsApp cadastrado. Edite o cadastro dele antes.",
    };
  }

  const result = await sendWhatsAppTemplate(
    group.telefone,
    reminderMessageParams(group)
  );

  if (!result.ok) {
    return { error: result.error };
  }

  await prisma.monthlyPayment.updateMany({
    where: { id: { in: group.paymentIds } },
    data: { lembreteEnviadoEm: new Date() },
  });
  revalidatePath("/cobrancas");
  return { success: "Lembrete enviado pelo WhatsApp." };
}
