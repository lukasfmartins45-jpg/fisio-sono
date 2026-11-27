import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { revertPendingBeforeRentalStart } from "@/lib/actions/payments";

// Rota de uso único (removida após o uso): desfaz o efeito do bug em que
// meses anteriores ao início real da locação de um paciente foram
// marcados como "pendente" pelo job de marcação automática.
export async function GET() {
  const session = await getSession();
  if (!session.userId || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const revertidos = await revertPendingBeforeRentalStart();
  return NextResponse.json({ ok: true, revertidos });
}
