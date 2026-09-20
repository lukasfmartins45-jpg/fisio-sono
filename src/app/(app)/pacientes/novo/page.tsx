import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PatientForm from "@/components/PatientForm";
import { createPatientAction } from "@/lib/actions/patients";

export default async function NovoPacientePage() {
  const equipments = await prisma.equipment.findMany({
    orderBy: { numeroSerie: "asc" },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/pacientes" className="text-sm text-teal-700 hover:underline">
          &larr; Voltar
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">
          Novo paciente
        </h1>
      </div>
      <PatientForm
        action={createPatientAction}
        equipments={equipments}
        submitLabel="Cadastrar"
      />
    </div>
  );
}
