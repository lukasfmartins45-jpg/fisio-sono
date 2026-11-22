import Link from "next/link";
import { listPendingByPatient, formatMesesList, formatValor } from "@/lib/cobrancas";
import SendReminderButton from "@/components/cobrancas/SendReminderButton";

export default async function CobrancasPage() {
  const groups = await listPendingByPatient();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Cobranças</h1>
        <p className="text-sm text-slate-500">
          Pacientes com locação ativa e pagamento pendente em meses já
          encerrados. O lembrete é enviado pelo WhatsApp cadastrado no
          paciente, com o total de meses em aberto.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Paciente</th>
              <th className="px-4 py-2">WhatsApp</th>
              <th className="px-4 py-2 text-center">Meses pendentes</th>
              <th className="px-4 py-2">Valor devido</th>
              <th className="px-4 py-2">Último lembrete</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groups.map((g) => (
              <tr key={g.patientId}>
                <td className="px-4 py-2">
                  <Link
                    href={`/pacientes/${g.patientId}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {g.patientName}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {g.telefone ?? (
                    <span className="text-amber-600">não cadastrado</span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {g.meses.length}
                  </span>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatMesesList(g.meses)}/{g.ano}
                  </p>
                </td>
                <td className="px-4 py-2 font-medium text-slate-800">
                  {formatValor(g.valorTotal)}
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {g.ultimoLembreteEm
                    ? new Date(g.ultimoLembreteEm).toLocaleString("pt-BR")
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  {g.telefone && (
                    <SendReminderButton
                      patientId={g.patientId}
                      jaEnviado={!!g.ultimoLembreteEm}
                    />
                  )}
                </td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma pendência no momento. 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
