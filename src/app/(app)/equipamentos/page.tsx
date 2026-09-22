import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  EQUIPMENT_STATUS,
  EQUIPMENT_STATUS_LABELS,
  type EquipmentStatus,
} from "@/lib/constants";

const STATUS_BADGE: Record<EquipmentStatus, string> = {
  DISPONIVEL: "bg-green-100 text-green-800",
  EM_LOCACAO: "bg-blue-100 text-blue-800",
  VENDIDO: "bg-slate-200 text-slate-700",
  EM_MANUTENCAO: "bg-amber-100 text-amber-800",
};

export default async function EquipamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = params.status;
  const q = params.q?.trim();

  const equipamentos = await prisma.equipment.findMany({
    where: {
      status: status && EQUIPMENT_STATUS.includes(status as EquipmentStatus)
        ? status
        : undefined,
      OR: q
        ? [
            { numeroSerie: { contains: q } },
            { tipo: { contains: q } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Equipamentos</h1>
          <p className="text-sm text-slate-500">{equipamentos.length} cadastrado(s)</p>
        </div>
        <Link
          href="/equipamentos/novo"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo equipamento
        </Link>
      </div>

      <form className="flex flex-wrap gap-2" action="/equipamentos">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por série ou tipo..."
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          {EQUIPMENT_STATUS.map((s) => (
            <option key={s} value={s}>
              {EQUIPMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Número de série</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Manutenção</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {equipamentos.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link
                    href={`/equipamentos/${e.id}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {e.numeroSerie}
                  </Link>
                </td>
                <td className="px-4 py-2">{e.tipo}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_BADGE[e.status as EquipmentStatus] ?? "bg-slate-100"
                    }`}
                  >
                    {EQUIPMENT_STATUS_LABELS[e.status as EquipmentStatus] ?? e.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {e.tipoManutencao ?? "—"}
                </td>
              </tr>
            ))}
            {equipamentos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Nenhum equipamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
