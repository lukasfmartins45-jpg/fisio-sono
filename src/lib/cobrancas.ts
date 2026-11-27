import { prisma } from "@/lib/prisma";
import { MESES_LONGOS } from "@/lib/constants";
import { markElapsedMonthsAsPending } from "@/lib/actions/payments";

export type PendingGroup = {
  patientId: string;
  patientName: string;
  telefone: string | null;
  ano: number;
  paymentIds: string[];
  novosPaymentIds: string[]; // ainda sem lembrete enviado
  meses: number[];
  valorTotal: number;
  ultimoLembreteEm: Date | null;
};

/**
 * Pagamentos pendentes de meses já decorridos (não cobra meses futuros),
 * de pacientes com locação ativa no ano corrente, agrupados por paciente.
 */
export async function listPendingByPatient(): Promise<PendingGroup[]> {
  await markElapsedMonthsAsPending();
  const now = new Date();
  const ano = now.getFullYear();
  const mesAtual = now.getMonth() + 1;

  const [payments, priceTable] = await Promise.all([
    prisma.monthlyPayment.findMany({
      where: {
        status: "PENDENTE",
        mes: { lte: mesAtual },
        rentalPeriod: { ano, status: "EM_LOCACAO" },
      },
      include: { rentalPeriod: { include: { patient: true } } },
      orderBy: [{ rentalPeriod: { patient: { nome: "asc" } } }, { mes: "asc" }],
    }),
    prisma.priceTable.findUnique({ where: { ano } }),
  ]);

  const valorMensal = priceTable?.valor ?? 0;
  const groups = new Map<string, PendingGroup>();

  for (const p of payments) {
    const patientId = p.rentalPeriod.patientId;
    let group = groups.get(patientId);
    if (!group) {
      group = {
        patientId,
        patientName: p.rentalPeriod.patient.nome,
        telefone: p.rentalPeriod.patient.telefone,
        ano,
        paymentIds: [],
        novosPaymentIds: [],
        meses: [],
        valorTotal: 0,
        ultimoLembreteEm: null,
      };
      groups.set(patientId, group);
    }
    group.paymentIds.push(p.id);
    group.meses.push(p.mes);
    group.valorTotal += valorMensal;
    if (!p.lembreteEnviadoEm) group.novosPaymentIds.push(p.id);
    if (
      p.lembreteEnviadoEm &&
      (!group.ultimoLembreteEm || p.lembreteEnviadoEm > group.ultimoLembreteEm)
    ) {
      group.ultimoLembreteEm = p.lembreteEnviadoEm;
    }
  }

  return Array.from(groups.values());
}

export function formatMesesList(meses: number[]): string {
  const nomes = meses.map((m) => MESES_LONGOS[m - 1]);
  if (nomes.length === 1) return nomes[0];
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

export function formatValor(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function reminderMessageParams(group: PendingGroup): string[] {
  return [
    group.patientName,
    `${formatMesesList(group.meses)}/${group.ano}`,
    formatValor(group.valorTotal),
  ];
}
