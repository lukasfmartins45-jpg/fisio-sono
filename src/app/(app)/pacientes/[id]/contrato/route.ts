import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { generateContractPdf } from "@/lib/contract-pdf";

const BLANK = "___________________";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSession();
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: { equipment: true },
  });

  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  const dataInicio = patient.inicioLocacao ?? new Date();
  const dataTermino = new Date(dataInicio);
  dataTermino.setMonth(dataTermino.getMonth() + 1);

  const ano = dataInicio.getFullYear();
  const price = await prisma.priceTable.findUnique({ where: { ano } });

  const equipamentoTipo =
    patient.equipment?.tipo ?? patient.aparelhoLocado ?? BLANK;
  const equipamentoSerie =
    patient.equipment?.numeroSerie ?? patient.identificacaoAparelho ?? BLANK;

  const pdfBytes = await generateContractPdf({
    nomePaciente: patient.nome,
    cpfPaciente: patient.cpf ?? BLANK,
    rgPaciente: patient.rg ?? BLANK,
    enderecoPaciente: patient.endereco ?? BLANK,
    cidadePaciente: patient.cidade ?? BLANK,
    equipamentoTipo,
    equipamentoSerie,
    valorMensal: price?.valor ?? 0,
    dataInicio,
    dataTermino,
    dataContrato: dataInicio,
  });

  const fileName = `contrato-${patient.nome.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
    },
  });
}
