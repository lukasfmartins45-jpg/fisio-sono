import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PatientForm from "@/components/PatientForm";
import DeletePatientButton from "@/components/DeletePatientButton";
import StockSaleForm from "@/components/estoque/StockSaleForm";
import { updatePatientAction } from "@/lib/actions/patients";
import { RENTAL_STATUS_LABELS, type RentalStatus } from "@/lib/constants";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export default async function PacienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [patient, equipments, materiaisVendaveis] = await Promise.all([
    prisma.patient.findUnique({
      where: { id },
      include: {
        rentalPeriods: {
          orderBy: { ano: "desc" },
          include: { payments: true },
        },
        equipmentAssignments: {
          orderBy: { inicio: "desc" },
          include: { equipment: true },
        },
        stockMovements: {
          where: { tipo: "SAIDA" },
          orderBy: { data: "desc" },
          include: { stockItem: true },
        },
      },
    }),
    prisma.equipment.findMany({ orderBy: { numeroSerie: "asc" } }),
    prisma.stockItem.findMany({ orderBy: [{ categoria: "asc" }, { nome: "asc" }] }),
  ]);

  if (!patient) notFound();

  // Só mostra no seletor os equipamentos disponíveis, mais o que já está
  // com este paciente (evita vincular por engano um equipamento que já
  // está em uso com outro paciente).
  const equipmentsSelecionaveis = equipments.filter(
    (e) => e.status === "DISPONIVEL" || e.id === patient.equipmentId
  );

  const boundAction = updatePatientAction.bind(null, patient.id);

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/pacientes" className="text-sm text-blue-700 hover:underline">
            &larr; Voltar
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-slate-900">
            {patient.nome}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/pacientes/${patient.id}/contrato`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Gerar contrato (PDF)
          </a>
          <DeletePatientButton patientId={patient.id} />
        </div>
      </div>

      <PatientForm
        key={`${patient.id}-${patient.updatedAt.toISOString()}`}
        action={boundAction}
        patient={patient}
        equipments={equipmentsSelecionaveis}
      />

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Equipamentos utilizados
        </h2>
        {patient.equipmentAssignments.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nenhum equipamento vinculado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Nº de série</th>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Início</th>
                  <th className="px-4 py-2">Fim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patient.equipmentAssignments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2">
                      {a.equipment ? (
                        <Link
                          href={`/equipamentos/${a.equipment.id}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {a.numeroSerie}
                        </Link>
                      ) : (
                        <span className="text-slate-500">{a.numeroSerie} (removido)</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {a.equipment?.tipo ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{formatDate(a.inicio)}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {a.fim ? (
                        formatDate(a.fim)
                      ) : (
                        <span className="font-medium text-blue-700">Em uso</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Materiais (máscaras, tubos, CPAP vendido)
        </h2>
        {patient.stockMovements.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum material registrado ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {patient.stockMovements.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-slate-700">{m.stockItem.nome}</span>
                <span className="text-slate-500">{m.quantidade}x</span>
                <span className="text-slate-400">
                  {new Date(m.data).toLocaleDateString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
        <details className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Registrar nova compra (ex: máscara em retorno)
          </summary>
          <div className="mt-4">
            <StockSaleForm items={materiaisVendaveis} fixedPatientId={patient.id} />
          </div>
        </details>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Histórico de pagamentos por ano
        </h2>
        {patient.rentalPeriods.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nenhum ano de locação registrado. Adicione em{" "}
            <Link href="/pagamentos" className="text-blue-700 hover:underline">
              Pagamentos
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {patient.rentalPeriods.map((period) => {
              const pagos = period.payments.filter(
                (p) => p.status === "PAGO" || p.status === "CORTESIA"
              ).length;
              return (
                <li
                  key={period.id}
                  className="flex items-center justify-between px-4 py-2 text-sm"
                >
                  <Link
                    href={`/pagamentos?ano=${period.ano}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {period.ano}
                  </Link>
                  <span className="text-slate-500">
                    {RENTAL_STATUS_LABELS[period.status as RentalStatus] ?? period.status}
                  </span>
                  <span className="text-slate-500">{pagos}/12 meses pagos</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
