import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listPendingMonthlyPayments, reminderMessageParams } from "@/lib/cobrancas";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const pending = await listPendingMonthlyPayments();

  const toSend = pending.filter(
    (p) => !p.lembreteEnviadoEm && p.rentalPeriod.patient.telefone
  );

  const results: { patient: string; ok: boolean; error?: string }[] = [];

  for (const payment of toSend) {
    const result = await sendWhatsAppTemplate(
      payment.rentalPeriod.patient.telefone!,
      reminderMessageParams(
        payment.rentalPeriod.patient.nome,
        payment.mes,
        payment.rentalPeriod.ano
      )
    );
    if (result.ok) {
      await prisma.monthlyPayment.update({
        where: { id: payment.id },
        data: { lembreteEnviadoEm: new Date() },
      });
    }
    results.push({
      patient: payment.rentalPeriod.patient.nome,
      ok: result.ok,
      error: result.ok ? undefined : result.error,
    });
  }

  return NextResponse.json({ sent: results.length, results });
}
