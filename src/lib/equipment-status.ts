import { prisma } from "@/lib/prisma";

/**
 * Mantém o status do inventário coerente quando o equipamento vinculado a um
 * paciente muda: libera o equipamento antigo e marca o novo como em locação.
 * Nunca sobrescreve um equipamento marcado como Vendido ou Em manutenção.
 */
export async function syncEquipmentAssignment(
  oldEquipmentId: string | null,
  newEquipmentId: string | null
) {
  if (oldEquipmentId === newEquipmentId) return;

  if (oldEquipmentId) {
    await prisma.equipment.updateMany({
      where: { id: oldEquipmentId, status: "EM_LOCACAO" },
      data: { status: "DISPONIVEL" },
    });
  }

  if (newEquipmentId) {
    await prisma.equipment.updateMany({
      where: { id: newEquipmentId, status: "DISPONIVEL" },
      data: { status: "EM_LOCACAO" },
    });
  }
}
