import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PatientForm from "@/components/PatientForm";
import DeletePatientButton from "@/components/DeletePatientButton";
import { updatePatientAction } from "@/lib/actions/patients";
import { RENTAL_STATUS_LABELS, type RentalStatus } from "@/lib/constants";

export default async function PacienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [patient, equipments] = await Promise.all([
    prisma.patient.findUnique({
      where: { id },
      include: {
        rentalPeriods: {
          orderBy: { ano: "desc" },
          include: { payments: true },
        },
      },
    }),
    prisma.equipment.findMany({ orderBy: { numeroSerie: "asc" } }),
  ]);

  if (!patient) notFound();

  const boundAction = updatePatientAction.bind(null, patient.id);

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/pacientes" className="text-sm text-teal-700 hover:underline">
            &larr; Voltar
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-slate-900">
            {patient.nome}
          </h1>
        </div>
        <DeletePatientButton patientId={patient.id} />
      </div>

      <PatientForm action={boundAction} patient={patient} equipments={equipments} />

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Histórico de pagamentos por ano
        </h2>
        {patient.rentalPeriods.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nenhum ano de locação registrado. Adicione em{" "}
            <Link href="/pagamentos" className="text-teal-700 hover:underline">
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
                    className="font-medium text-teal-700 hover:underline"
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
