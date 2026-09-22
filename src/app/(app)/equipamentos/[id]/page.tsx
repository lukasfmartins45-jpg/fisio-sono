import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EquipmentForm from "@/components/EquipmentForm";
import DeleteEquipmentButton from "@/components/DeleteEquipmentButton";
import { updateEquipmentAction } from "@/lib/actions/equipment";

export default async function EquipamentoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: { patients: { orderBy: { nome: "asc" } } },
  });

  if (!equipment) notFound();

  const boundAction = updateEquipmentAction.bind(null, equipment.id);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/equipamentos" className="text-sm text-blue-700 hover:underline">
            &larr; Voltar
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-slate-900">
            {equipment.numeroSerie}
          </h1>
        </div>
        <DeleteEquipmentButton equipmentId={equipment.id} />
      </div>

      <EquipmentForm
        key={`${equipment.id}-${equipment.updatedAt.toISOString()}`}
        action={boundAction}
        equipment={equipment}
      />

      {equipment.patients.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Pacientes vinculados a este equipamento
          </h2>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {equipment.patients.map((p) => (
              <li key={p.id} className="px-4 py-2 text-sm">
                <Link
                  href={`/pacientes/${p.id}`}
                  className="text-blue-700 hover:underline"
                >
                  {p.nome}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
