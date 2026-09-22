import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  EQUIPMENT_STATUS,
  EQUIPMENT_STATUS_LABELS,
  MESES,
  type EquipmentStatus,
} from "@/lib/constants";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const currentYear = new Date().getFullYear();

  const [
    totalPacientes,
    locacoesAtivas,
    equipamentosDisponiveis,
    adesaoSim,
    adesaoNao,
    pendenciasAno,
    equipamentosPorStatus,
    cidadesRaw,
    price,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.patient.count({ where: { fimLocacao: null } }),
    prisma.equipment.count({ where: { status: "DISPONIVEL" } }),
    prisma.patient.count({ where: { adesaoTerapia: "SIM" } }),
    prisma.patient.count({ where: { adesaoTerapia: "NAO" } }),
    prisma.monthlyPayment.count({
      where: { status: "PENDENTE", rentalPeriod: { ano: currentYear } },
    }),
    prisma.equipment.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.patient.groupBy({
      by: ["cidade"],
      _count: { cidade: true },
      where: { cidade: { not: null } },
    }),
    prisma.priceTable.findUnique({ where: { ano: currentYear } }),
  ]);

  // Paciente ativo (sem fim de locação) cujo equipamento vinculado não está
  // marcado como "Em locação" — geralmente porque um dos dois foi editado
  // sem o outro (ou veio assim da planilha original).
  const pacientesComEquipamentoDivergente = await prisma.patient.findMany({
    where: {
      fimLocacao: null,
      equipmentId: { not: null },
      equipment: { status: { not: "EM_LOCACAO" } },
    },
    select: {
      id: true,
      nome: true,
      equipment: { select: { id: true, numeroSerie: true, status: true } },
    },
  });

  // Equipamento marcado "Em locação" sem nenhum paciente ativo vinculado a ele.
  const equipamentosSemPacienteAtivo = await prisma.equipment.findMany({
    where: {
      status: "EM_LOCACAO",
      patients: { none: { fimLocacao: null } },
    },
    select: { id: true, numeroSerie: true, tipo: true },
  });

  const adesaoTotal = adesaoSim + adesaoNao;
  const adesaoPct = adesaoTotal > 0 ? Math.round((adesaoSim / adesaoTotal) * 100) : 0;

  const statusCounts = Object.fromEntries(
    EQUIPMENT_STATUS.map((s) => [
      s,
      equipamentosPorStatus.find((e) => e.status === s)?._count.status ?? 0,
    ])
  ) as Record<EquipmentStatus, number>;

  const cidadesTop = cidadesRaw
    .map((c) => ({ cidade: c.cidade ?? "—", total: c._count.cidade }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const pagamentosPorMes = await Promise.all(
    Array.from({ length: 12 }, (_, i) => i + 1).map(async (mes) => {
      const [pagos, pendentes] = await Promise.all([
        prisma.monthlyPayment.count({
          where: {
            mes,
            status: "PAGO",
            rentalPeriod: { ano: currentYear },
          },
        }),
        prisma.monthlyPayment.count({
          where: {
            mes,
            status: "PENDENTE",
            rentalPeriod: { ano: currentYear },
          },
        }),
      ]);
      return { mes, pagos, pendentes };
    })
  );

  const valorMensal = price?.valor ?? 0;
  const totalPagoAno = pagamentosPorMes.reduce((acc, m) => acc + m.pagos, 0);
  const faturamentoEstimadoAno = totalPagoAno * valorMensal;

  const maxMes = Math.max(1, ...pagamentosPorMes.map((m) => m.pagos + m.pendentes));

  // Novos pacientes por mês (usando o início da locação como data de
  // referência, já que costuma coincidir com a consulta/captação do paciente).
  const pacientesDoAno = await prisma.patient.findMany({
    where: {
      inicioLocacao: {
        gte: new Date(currentYear, 0, 1),
        lt: new Date(currentYear + 1, 0, 1),
      },
    },
    select: { inicioLocacao: true },
  });
  const novosPacientesPorMes = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const total = pacientesDoAno.filter(
      (p) => p.inicioLocacao && p.inicioLocacao.getMonth() + 1 === mes
    ).length;
    return { mes, total };
  });
  const maxNovosPacientes = Math.max(1, ...novosPacientesPorMes.map((m) => m.total));
  const novosPacientesMesAtual =
    novosPacientesPorMes[new Date().getMonth()]?.total ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Visão consolidada do cadastro, equipamentos e pagamentos de {currentYear}
        </p>
      </div>

      {(pacientesComEquipamentoDivergente.length > 0 ||
        equipamentosSemPacienteAtivo.length > 0) && (
        <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <span>⚠️</span> Inconsistências entre pacientes e equipamentos
          </h2>
          <p className="text-xs text-amber-800">
            Isso acontece quando o &quot;Fim da locação&quot; de um paciente e o
            status do equipamento vinculado ficam desencontrados (ex.: editando
            um dos dois direto, sem passar pelo outro). Confira e ajuste.
          </p>

          {pacientesComEquipamentoDivergente.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-amber-800">
                Pacientes ativos cujo equipamento não está &quot;Em locação&quot;
              </p>
              <ul className="space-y-1">
                {pacientesComEquipamentoDivergente.map((p) => (
                  <li key={p.id} className="text-sm text-amber-900">
                    <Link href={`/pacientes/${p.id}`} className="font-medium underline">
                      {p.nome}
                    </Link>{" "}
                    — equipamento{" "}
                    <Link
                      href={`/equipamentos/${p.equipment!.id}`}
                      className="underline"
                    >
                      {p.equipment!.numeroSerie}
                    </Link>{" "}
                    está como &quot;
                    {EQUIPMENT_STATUS_LABELS[p.equipment!.status as EquipmentStatus] ??
                      p.equipment!.status}
                    &quot;
                  </li>
                ))}
              </ul>
            </div>
          )}

          {equipamentosSemPacienteAtivo.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-amber-800">
                Equipamentos &quot;Em locação&quot; sem paciente ativo vinculado
              </p>
              <ul className="space-y-1">
                {equipamentosSemPacienteAtivo.map((e) => (
                  <li key={e.id} className="text-sm text-amber-900">
                    <Link href={`/equipamentos/${e.id}`} className="font-medium underline">
                      {e.numeroSerie}
                    </Link>{" "}
                    ({e.tipo})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Pacientes cadastrados" value={String(totalPacientes)} />
        <StatCard label="Locações ativas" value={String(locacoesAtivas)} />
        <StatCard
          label="Equipamentos disponíveis"
          value={String(equipamentosDisponiveis)}
        />
        <StatCard label="Adesão à terapia" value={`${adesaoPct}%`} />
        <StatCard label={`Pendências ${currentYear}`} value={String(pendenciasAno)} />
        <StatCard
          label="Novos pacientes este mês"
          value={String(novosPacientesMesAtual)}
          hint="Pelo início da locação"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Situação dos equipamentos
          </h2>
          <ul className="space-y-2">
            {EQUIPMENT_STATUS.map((s) => (
              <li key={s} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{EQUIPMENT_STATUS_LABELS[s]}</span>
                <span className="font-medium text-slate-900">{statusCounts[s]}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Cidades com mais pacientes
          </h2>
          <ul className="space-y-2">
            {cidadesTop.map((c) => (
              <li key={c.cidade} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{c.cidade}</span>
                <span className="font-medium text-slate-900">{c.total}</span>
              </li>
            ))}
            {cidadesTop.length === 0 && (
              <p className="text-sm text-slate-400">Sem dados de cidade ainda.</p>
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Pagamentos por mês em {currentYear}
          </h2>
          <p className="text-sm text-slate-500">
            Faturamento estimado do ano:{" "}
            <span className="font-medium text-slate-900">
              {faturamentoEstimadoAno.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </p>
        </div>
        <div className="grid grid-cols-12 items-end gap-2" style={{ height: 160 }}>
          {pagamentosPorMes.map((m, i) => (
            <div key={m.mes} className="flex h-full flex-col items-center justify-end gap-1">
              <div className="flex h-full w-full flex-col-reverse gap-0.5">
                <div
                  className="w-full rounded-t bg-green-400"
                  style={{ height: `${(m.pagos / maxMes) * 100}%` }}
                  title={`${m.pagos} pagos`}
                />
                <div
                  className="w-full rounded-t bg-amber-400"
                  style={{ height: `${(m.pendentes / maxMes) * 100}%` }}
                  title={`${m.pendentes} pendentes`}
                />
              </div>
              <span className="text-[10px] text-slate-400">{MESES[i]}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-400" /> Pagos
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Pendentes
          </span>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Faturamento estimado = meses pagos no ano × valor da mensalidade
          configurado em Pagamentos (R${" "}
          {valorMensal.toLocaleString("pt-BR")}).
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Novos pacientes por mês em {currentYear}
        </h2>
        <div className="grid grid-cols-12 items-end gap-2" style={{ height: 160 }}>
          {novosPacientesPorMes.map((m, i) => (
            <div key={m.mes} className="flex h-full flex-col items-center justify-end gap-1">
              <div className="flex h-full w-full flex-col-reverse">
                <div
                  className="w-full rounded-t bg-sky-400"
                  style={{ height: `${(m.total / maxNovosPacientes) * 100}%` }}
                  title={`${m.total} novo(s) paciente(s)`}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-600">
                {m.total > 0 ? m.total : ""}
              </span>
              <span className="text-[10px] text-slate-400">{MESES[i]}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Baseado na data de início da locação de cada paciente (costuma
          coincidir com a consulta que trouxe o paciente novo).
        </p>
      </section>
    </div>
  );
}
