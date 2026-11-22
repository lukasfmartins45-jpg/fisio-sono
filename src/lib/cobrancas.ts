import { prisma } from "@/lib/prisma";
import { MESES_LONGOS } from "@/lib/constants";

/**
 * Pagamentos pendentes de meses já decorridos (não cobra meses futuros),
 * apenas de pacientes com locação ativa no ano corrente.
 */
export async function listPendingMonthlyPayments() {
  const now = new Date();
  const ano = now.getFullYear();
  const mesAtual = now.getMonth() + 1;

  const payments = await prisma.monthlyPayment.findMany({
    where: {
      status: "PENDENTE",
      mes: { lte: mesAtual },
      rentalPeriod: { ano, status: "EM_LOCACAO" },
    },
    include: {
      rentalPeriod: { include: { patient: true } },
    },
    orderBy: [{ rentalPeriod: { patient: { nome: "asc" } } }, { mes: "asc" }],
  });

  return payments;
}

export function reminderMessageParams(
  patientName: string,
  mes: number,
  ano: number
): string[] {
  return [patientName, MESES_LONGOS[mes - 1], String(ano)];
}
