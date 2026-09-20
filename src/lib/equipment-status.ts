import { prisma } from "@/lib/prisma";

/**
 * Mantém o status do inventário e o histórico de uso coerentes quando o
 * equipamento vinculado a um paciente muda: libera o equipamento antigo,
 * marca o novo como em locação, e fecha/abre os registros de histórico.
 * Nunca sobrescreve um equipamento marcado como Vendido ou Em manutenção.
 */
export async function syncEquipmentAssignment(
  patientId: string,
  oldEquipmentId: string | null,
  newEquipmentId: string | null
) {
  if (oldEquipmentId === newEquipmentId) return;

  if (oldEquipmentId) {
    await prisma.equipment.updateMany({
      where: { id: oldEquipmentId, status: "EM_LOCACAO" },
      data: { status: "DISPONIVEL" },
    });
    await prisma.equipmentAssignment.updateMany({
      where: { patientId, equipmentId: oldEquipmentId, fim: null },
      data: { fim: new Date() },
    });
  }

  if (newEquipmentId) {
    const equipment = await prisma.equipment.findUnique({
      where: { id: newEquipmentId },
    });
    if (equipment) {
      await prisma.equipment.updateMany({
        where: { id: newEquipmentId, status: "DISPONIVEL" },
        data: { status: "EM_LOCACAO" },
      });
      await prisma.equipmentAssignment.create({
        data: {
          patientId,
          equipmentId: newEquipmentId,
          numeroSerie: equipment.numeroSerie,
        },
      });
    }
  }
}
