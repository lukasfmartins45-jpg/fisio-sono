import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listPendingByPatient, reminderMessageParams } from "@/lib/cobrancas";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const groups = await listPendingByPatient();
  // Só cobra quem tem pelo menos um mês ainda sem lembrete enviado.
  const toSend = groups.filter((g) => g.telefone && g.novosPaymentIds.length > 0);

  const results: { patient: string; ok: boolean; error?: string }[] = [];

  for (const group of toSend) {
    const result = await sendWhatsAppTemplate(
      group.telefone!,
      reminderMessageParams(group)
    );
    if (result.ok) {
      await prisma.monthlyPayment.updateMany({
        where: { id: { in: group.paymentIds } },
        data: { lembreteEnviadoEm: new Date() },
      });
    }
    results.push({
      patient: group.patientName,
      ok: result.ok,
      error: result.ok ? undefined : result.error,
    });
  }

  return NextResponse.json({ sent: results.length, results });
}
