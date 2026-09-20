import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ADESAO_TERAPIA_LABELS, type AdesaoTerapia } from "@/lib/constants";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ativos?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim();
  const ativos = params.ativos === "1";

  const pacientes = await prisma.patient.findMany({
    where: {
      fimLocacao: ativos ? null : undefined,
      OR: q
        ? [{ nome: { contains: q } }, { cidade: { contains: q } }]
        : undefined,
    },
    orderBy: { nome: "asc" },
    include: { equipment: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Pacientes</h1>
          <p className="text-sm text-slate-500">{pacientes.length} encontrado(s)</p>
        </div>
        <Link
          href="/pacientes/novo"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Novo paciente
        </Link>
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/pacientes">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou cidade..."
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="ativos"
            value="1"
            defaultChecked={ativos}
            className="rounded border-slate-300"
          />
          Somente locações ativas
        </label>
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
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Cidade</th>
              <th className="px-4 py-2">Aparelho</th>
              <th className="px-4 py-2">Início</th>
              <th className="px-4 py-2">Fim</th>
              <th className="px-4 py-2">Adesão</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pacientes.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link
                    href={`/pacientes/${p.id}`}
                    className="font-medium text-teal-700 hover:underline"
                  >
                    {p.nome}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-500">{p.cidade ?? "—"}</td>
                <td className="px-4 py-2 text-slate-500">
                  {p.equipment?.tipo ?? p.aparelhoLocado ?? "—"}
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {formatDate(p.inicioLocacao)}
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {formatDate(p.fimLocacao)}
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {p.adesaoTerapia
                    ? ADESAO_TERAPIA_LABELS[p.adesaoTerapia as AdesaoTerapia] ??
                      p.adesaoTerapia
                    : "—"}
                </td>
              </tr>
            ))}
            {pacientes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Nenhum paciente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
