import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MESES } from "@/lib/constants";
import PaymentCell from "@/components/payments/PaymentCell";
import RentalStatusSelect from "@/components/payments/RentalStatusSelect";
import RemovePeriodButton from "@/components/payments/RemovePeriodButton";
import AddPatientToYear from "@/components/payments/AddPatientToYear";
import PriceEditor from "@/components/payments/PriceEditor";

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const ano = Number(params.ano) || currentYear;

  const [years, rentalPeriods, allPatients, price] = await Promise.all([
    prisma.rentalPeriod.findMany({
      distinct: ["ano"],
      select: { ano: true },
      orderBy: { ano: "desc" },
    }),
    prisma.rentalPeriod.findMany({
      where: { ano },
      include: { patient: true, payments: { orderBy: { mes: "asc" } } },
      orderBy: { patient: { nome: "asc" } },
    }),
    prisma.patient.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.priceTable.findUnique({ where: { ano } }),
  ]);

  const yearOptions = Array.from(
    new Set([...years.map((y) => y.ano), currentYear, currentYear + 1])
  ).sort((a, b) => b - a);

  const patientsInYear = new Set(rentalPeriods.map((r) => r.patientId));
  const availablePatients = allPatients.filter((p) => !patientsInYear.has(p.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Pagamentos — {ano}
          </h1>
          <p className="text-sm text-slate-500">
            {rentalPeriods.length} paciente(s) em locação neste ano
          </p>
        </div>
        <div className="flex items-center gap-2">
          {yearOptions.map((y) => (
            <Link
              key={y}
              href={`/pagamentos?ano=${y}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                y === ano
                  ? "bg-teal-600 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {y}
            </Link>
          ))}
        </div>
      </div>

      <PriceEditor ano={ano} valor={price?.valor ?? 0} />

      <AddPatientToYear ano={ano} patients={availablePatients} />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2">Paciente</th>
              <th className="px-2 py-2">Situação</th>
              {MESES.map((m) => (
                <th key={m} className="px-1 py-2 text-center">
                  {m}
                </th>
              ))}
              <th className="px-2 py-2 text-center">Pago</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rentalPeriods.map((period) => {
              const pagos = period.payments.filter(
                (p) => p.status === "PAGO" || p.status === "CORTESIA"
              ).length;
              return (
                <tr key={period.id} className="hover:bg-slate-50">
                  <td className="sticky left-0 z-10 bg-white px-3 py-1.5 hover:bg-slate-50">
                    <Link
                      href={`/pacientes/${period.patientId}`}
                      className="font-medium text-teal-700 hover:underline"
                    >
                      {period.patient.nome}
                    </Link>
                  </td>
                  <td className="px-2 py-1.5">
                    <RentalStatusSelect
                      rentalPeriodId={period.id}
                      status={period.status}
                    />
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
                    const payment = period.payments.find((p) => p.mes === mes);
                    return (
                      <td key={mes} className="px-1 py-1.5">
                        <PaymentCell
                          rentalPeriodId={period.id}
                          mes={mes}
                          status={payment?.status ?? null}
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 text-center font-medium text-slate-700">
                    {pagos}
                  </td>
                  <td className="px-2 py-1.5">
                    <RemovePeriodButton rentalPeriodId={period.id} />
                  </td>
                </tr>
              );
            })}
            {rentalPeriods.length === 0 && (
              <tr>
                <td colSpan={16} className="px-4 py-8 text-center text-slate-400">
                  Nenhum paciente registrado para {ano}. Adicione um acima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
