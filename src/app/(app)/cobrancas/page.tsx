import Link from "next/link";
import { listPendingMonthlyPayments } from "@/lib/cobrancas";
import { MESES } from "@/lib/constants";
import SendReminderButton from "@/components/cobrancas/SendReminderButton";

export default async function CobrancasPage() {
  const payments = await listPendingMonthlyPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Cobranças</h1>
        <p className="text-sm text-slate-500">
          Pacientes com locação ativa e pagamento pendente em meses já
          encerrados. O lembrete é enviado pelo WhatsApp cadastrado no
          paciente.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Paciente</th>
              <th className="px-4 py-2">WhatsApp</th>
              <th className="px-4 py-2">Mês pendente</th>
              <th className="px-4 py-2">Último lembrete</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2">
                  <Link
                    href={`/pacientes/${p.rentalPeriod.patientId}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {p.rentalPeriod.patient.nome}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {p.rentalPeriod.patient.telefone ?? (
                    <span className="text-amber-600">não cadastrado</span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {MESES[p.mes - 1]}/{p.rentalPeriod.ano}
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {p.lembreteEnviadoEm
                    ? new Date(p.lembreteEnviadoEm).toLocaleString("pt-BR")
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  {p.rentalPeriod.patient.telefone && (
                    <SendReminderButton
                      monthlyPaymentId={p.id}
                      jaEnviado={!!p.lembreteEnviadoEm}
                    />
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
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
