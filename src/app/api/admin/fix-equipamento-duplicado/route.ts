import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * Utilitário de uso único (admin), para quando um equipamento fica
 * vinculado a dois pacientes ao mesmo tempo por engano: remove o vínculo
 * do paciente que não está mais com o equipamento, e garante que o
 * paciente correto tenha um registro de histórico de uso em aberto.
 *
 * Uso: /api/admin/fix-equipamento-duplicado?manter=<patientId>&remover=<patientId>
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session.userId || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const manterId = request.nextUrl.searchParams.get("manter");
  const removerId = request.nextUrl.searchParams.get("remover");
  if (!manterId || !removerId) {
    return NextResponse.json(
      { error: "Informe os parâmetros 'manter' e 'remover' (ids de paciente)." },
      { status: 400 }
    );
  }

  const [manter, remover] = await Promise.all([
    prisma.patient.findUnique({ where: { id: manterId } }),
    prisma.patient.findUnique({ where: { id: removerId } }),
  ]);
  if (!manter || !remover) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }
  if (!manter.equipmentId || manter.equipmentId !== remover.equipmentId) {
    return NextResponse.json({
      error: "Os dois pacientes não estão com o mesmo equipamento vinculado.",
      manterEquipmentId: manter.equipmentId,
      removerEquipmentId: remover.equipmentId,
    });
  }
  const equipmentId = manter.equipmentId;
  const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) {
    return NextResponse.json({ error: "Equipamento não encontrado." }, { status: 404 });
  }

  await prisma.patient.update({
    where: { id: removerId },
    data: { equipmentId: null },
  });

  const existingAssignment = await prisma.equipmentAssignment.findFirst({
    where: { patientId: manterId, equipmentId, fim: null },
  });
  if (!existingAssignment) {
    await prisma.equipmentAssignment.create({
      data: {
        patientId: manterId,
        equipmentId,
        numeroSerie: equipment.numeroSerie,
        inicio: manter.inicioLocacao ?? manter.createdAt,
      },
    });
  }

  return NextResponse.json({ ok: true, mantido: manter.nome, removido: remover.nome });
}
