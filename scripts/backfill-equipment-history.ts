/**
 * Preenche o histórico de equipamentos (tabela EquipmentAssignment) para
 * pacientes que já existiam no banco antes dessa funcionalidade existir.
 * Seguro rodar mais de uma vez: pula pacientes que já têm um registro de
 * histórico para o equipamento atualmente vinculado.
 *
 * Uso: npm run db:backfill-equipment-history
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const patients = await prisma.patient.findMany({
    where: { equipmentId: { not: null } },
    include: { equipment: true, equipmentAssignments: true },
  });

  let criados = 0;
  for (const patient of patients) {
    if (!patient.equipmentId || !patient.equipment) continue;

    const jaTemHistorico = patient.equipmentAssignments.some(
      (a) => a.equipmentId === patient.equipmentId
    );
    if (jaTemHistorico) continue;

    await prisma.equipmentAssignment.create({
      data: {
        patientId: patient.id,
        equipmentId: patient.equipmentId,
        numeroSerie: patient.equipment.numeroSerie,
        inicio:
          patient.inicioLocacao ?? patient.dataEntregaEquipamento ?? patient.createdAt,
        fim: patient.fimLocacao,
      },
    });
    criados++;
  }

  console.log(`Registros de histórico criados: ${criados}`);
  console.log(`Pacientes já com histórico (pulados): ${patients.length - criados}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
