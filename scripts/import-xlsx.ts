/**
 * Importa os dados extraídos da planilha original (data/dados-importacao.json,
 * não versionado por conter dados pessoais de pacientes) para o banco local.
 *
 * Uso: npm run db:import
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DATA_PATH = path.join(process.cwd(), "data", "dados-importacao.json");

type PacienteRaw = {
  nome: string;
  cidade: string | null;
  inicioLocacao: string | null;
  fimLocacao: string | null;
  aparelhoLocado: string | null;
  identificacaoAparelho: string | null;
  adesaoTerapia: string | null;
  compraCpap: string | null;
  dataEntregaEquipamento: string | null;
  dispositivo: string | null;
  nsAparelhoEntregue: string | null;
};

type EquipamentoRaw = {
  numeroSerie: string | null;
  tipo: string | null;
  obs: string | null;
  manutencaoHoras: number | null;
  tipoManutencao: string | null;
  dataManutencao: string | null;
  status: string | null;
};

type PagamentoRow = {
  nome: string;
  status: string | null;
  meses: Record<string, string>;
};

type DadosImportacao = {
  pacientes: PacienteRaw[];
  equipamentos: EquipamentoRaw[];
  pagamentos: Record<string, PagamentoRow[]>;
};

/** Remove o ".0" que o Excel deixa em campos numéricos lidos como texto (ex: "22221745377.0"). */
function cleanNumericArtifact(v: string | null): string | null {
  if (!v) return v;
  return /^\d+\.0$/.test(v.trim()) ? v.trim().slice(0, -2) : v;
}

function normalizeName(nome: string): string {
  return nome
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

function mapAdesao(v: string | null): string | null {
  if (!v) return null;
  const s = v.trim().toUpperCase();
  if (s === "SIM") return "SIM";
  if (s === "NÃO" || s === "NAO") return "NAO";
  if (s.includes("PRE") && s.includes("OP")) return "PRE_OP";
  return null;
}

function mapEquipmentStatus(v: string | null): string {
  if (!v) return "DISPONIVEL";
  const s = v.trim().toUpperCase();
  if (s.includes("DISPON")) return "DISPONIVEL";
  if (s.includes("LOCA")) return "EM_LOCACAO";
  if (s.includes("VEND")) return "VENDIDO";
  if (s.includes("MANU") || s.includes("MANT")) return "EM_MANUTENCAO";
  return "DISPONIVEL";
}

function mapRentalStatus(v: string | null): string {
  if (!v) return "EM_LOCACAO";
  const s = v.trim().toUpperCase();
  if (s.includes("FINAL")) return "FINALIZADO";
  return "EM_LOCACAO";
}

function mapPaymentStatus(v: string | undefined): string | null {
  if (!v) return null;
  const s = v.trim().toUpperCase();
  if (s === "PAGO") return "PAGO";
  if (s === "PENDENTE") return "PENDENTE";
  if (s === "CORTESIA") return "CORTESIA";
  return null;
}

function toDate(v: string | null): Date | null {
  if (!v) return null;
  const d = new Date(`${v}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

async function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error(
      `Arquivo não encontrado: ${DATA_PATH}\n` +
        "Gere-o a partir da planilha original antes de importar (ver README)."
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const data: DadosImportacao = JSON.parse(raw);

  console.log(`Equipamentos: ${data.equipamentos.length}`);
  console.log(`Pacientes: ${data.pacientes.length}`);

  // 1) Equipamentos
  const equipmentBySerial = new Map<string, string>(); // numeroSerie normalizado -> id
  for (const eq of data.equipamentos) {
    const numeroSerie = cleanNumericArtifact(eq.numeroSerie);
    if (!numeroSerie) continue;
    const created = await prisma.equipment.upsert({
      where: { numeroSerie },
      update: {
        tipo: eq.tipo ?? "CPAP",
        obs: eq.obs,
        manutencaoHoras: eq.manutencaoHoras,
        tipoManutencao: eq.tipoManutencao,
        dataManutencao: toDate(eq.dataManutencao),
        status: mapEquipmentStatus(eq.status),
      },
      create: {
        numeroSerie,
        tipo: eq.tipo ?? "CPAP",
        obs: eq.obs,
        manutencaoHoras: eq.manutencaoHoras,
        tipoManutencao: eq.tipoManutencao,
        dataManutencao: toDate(eq.dataManutencao),
        status: mapEquipmentStatus(eq.status),
      },
    });
    equipmentBySerial.set(numeroSerie.trim().toUpperCase(), created.id);
  }
  console.log(`Equipamentos importados: ${equipmentBySerial.size}`);

  // 2) Pacientes
  const patientByName = new Map<string, string>(); // nome normalizado -> id
  let pacientesCriados = 0;
  let vinculosEquipamento = 0;
  for (const p of data.pacientes) {
    let equipmentId: string | null = null;
    if (p.identificacaoAparelho) {
      const ident = p.identificacaoAparelho.trim().toUpperCase();
      for (const [serial, id] of equipmentBySerial) {
        if (ident.includes(serial) || serial.includes(ident)) {
          equipmentId = id;
          vinculosEquipamento++;
          break;
        }
      }
    }

    const patient = await prisma.patient.create({
      data: {
        nome: p.nome,
        cidade: p.cidade,
        inicioLocacao: toDate(p.inicioLocacao),
        fimLocacao: toDate(p.fimLocacao),
        aparelhoLocado: p.aparelhoLocado,
        identificacaoAparelho: cleanNumericArtifact(p.identificacaoAparelho),
        adesaoTerapia: mapAdesao(p.adesaoTerapia),
        compraCpap: p.compraCpap,
        dataEntregaEquipamento: toDate(p.dataEntregaEquipamento),
        dispositivo: p.dispositivo,
        nsAparelhoEntregue: cleanNumericArtifact(p.nsAparelhoEntregue),
        equipmentId,
      },
    });
    pacientesCriados++;
    patientByName.set(normalizeName(p.nome), patient.id);
  }
  console.log(
    `Pacientes importados: ${pacientesCriados} (vinculados a equipamento: ${vinculosEquipamento})`
  );

  // 3) Pagamentos por ano
  let periodosCriados = 0;
  let pagamentosSemPaciente = 0;
  for (const [anoStr, rows] of Object.entries(data.pagamentos)) {
    const ano = Number(anoStr);
    for (const row of rows) {
      const patientId = patientByName.get(normalizeName(row.nome));
      if (!patientId) {
        pagamentosSemPaciente++;
        console.warn(
          `Paciente não encontrado no cadastro para pagamento ${ano}: "${row.nome}"`
        );
        continue;
      }

      const existing = await prisma.rentalPeriod.findUnique({
        where: { patientId_ano: { patientId, ano } },
      });
      if (existing) continue;

      await prisma.rentalPeriod.create({
        data: {
          patientId,
          ano,
          status: mapRentalStatus(row.status),
          payments: {
            create: Array.from({ length: 12 }, (_, i) => ({
              mes: i + 1,
              status: mapPaymentStatus(row.meses[String(i + 1)]),
            })),
          },
        },
      });
      periodosCriados++;
    }
  }
  console.log(
    `Períodos de locação (ano x paciente) criados: ${periodosCriados}` +
      (pagamentosSemPaciente
        ? ` — ${pagamentosSemPaciente} linha(s) de pagamento sem paciente correspondente`
        : "")
  );

  console.log("Importação concluída.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
