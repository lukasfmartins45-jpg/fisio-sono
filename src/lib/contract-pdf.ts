import fs from "node:fs";
import path from "node:path";
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

// Dados fixos do LOCADOR (a empresa) — sempre os mesmos em todo contrato,
// como no modelo original (CONTRATO_PACIENTE_7.pdf).
const LOCADOR = {
  nomeEmpresa: "INSTITUTO DE TERAPIA RESPIRATÓRIA LTDA",
  enderecoEmpresa: "Avenida Monsenhor José Aloísio Pinto 300 Sala 1005 B Dom Expedito",
  cnpj: "49.411.808/0001-50",
  representante: "Lucas Erick Feijó Martins",
  qualificacaoRepresentante: "casado, fisioterapeuta",
  enderecoRepresentante:
    "Rua Elias Luís da Costa 662 Antônio Carlos Belchior, Sobral - CE",
  cpfRepresentante: "041.475.683-51",
};

const MARGIN = 56;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BODY_SIZE = 10.5;
const HEADING_SIZE = 11;
const LINE_HEIGHT = 15;
const BRAND_BLUE = rgb(0.12, 0.31, 0.85);
const TEXT_COLOR = rgb(0.1, 0.1, 0.12);

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "spacer"; height: number }
  | { type: "center"; text: string }
  | { type: "signature"; nome: string; papel: string };

export type ContractData = {
  nomePaciente: string;
  cpfPaciente: string;
  rgPaciente: string;
  enderecoPaciente: string;
  cidadePaciente: string;
  equipamentoTipo: string;
  equipamentoSerie: string;
  valorMensal: number;
  dataInicio: Date;
  dataTermino: Date;
  dataContrato: Date;
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatMoney(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateContractPdf(data: ContractData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const logoPath = path.join(process.cwd(), "public", "logo.jpg");
  const logoBytes = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null;
  const logoImage = logoBytes ? await pdfDoc.embedJpg(logoBytes) : null;
  const logoWidth = 170;
  const logoHeight = logoImage ? (logoWidth * logoImage.height) / logoImage.width : 0;

  let page!: PDFPage;
  let y!: number;

  function newPage() {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    if (logoImage) {
      page.drawImage(logoImage, {
        x: (PAGE_WIDTH - logoWidth) / 2,
        y: y - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
      y -= logoHeight + 28;
    }
  }

  function ensureSpace(height: number) {
    if (y - height < MARGIN) newPage();
  }

  newPage();

  function drawHeading(text: string) {
    ensureSpace(LINE_HEIGHT + 6);
    y -= 6;
    page.drawText(text, {
      x: MARGIN,
      y,
      size: HEADING_SIZE,
      font: fontBold,
      color: BRAND_BLUE,
    });
    y -= LINE_HEIGHT;
  }

  function drawParagraph(text: string) {
    const lines = wrapText(font, text, BODY_SIZE, CONTENT_WIDTH);
    ensureSpace(lines.length * LINE_HEIGHT);
    for (const line of lines) {
      ensureSpace(LINE_HEIGHT);
      page.drawText(line, { x: MARGIN, y, size: BODY_SIZE, font, color: TEXT_COLOR });
      y -= LINE_HEIGHT;
    }
    y -= 6;
  }

  function drawCenter(text: string) {
    ensureSpace(LINE_HEIGHT + 20);
    y -= 20;
    const width = font.widthOfTextAtSize(text, BODY_SIZE);
    page.drawText(text, {
      x: (PAGE_WIDTH - width) / 2,
      y,
      size: BODY_SIZE,
      font,
      color: TEXT_COLOR,
    });
    y -= LINE_HEIGHT;
  }

  function drawSignature(nome: string, papel: string) {
    ensureSpace(70);
    y -= 40;
    const lineWidth = 260;
    const x = (PAGE_WIDTH - lineWidth) / 2;
    page.drawLine({
      start: { x, y },
      end: { x: x + lineWidth, y },
      thickness: 1,
      color: TEXT_COLOR,
    });
    y -= 16;
    const nomeWidth = font.widthOfTextAtSize(nome, BODY_SIZE);
    page.drawText(nome, {
      x: (PAGE_WIDTH - nomeWidth) / 2,
      y,
      size: BODY_SIZE,
      font,
      color: TEXT_COLOR,
    });
    if (papel) {
      y -= LINE_HEIGHT;
      const papelWidth = font.widthOfTextAtSize(papel, BODY_SIZE);
      page.drawText(papel, {
        x: (PAGE_WIDTH - papelWidth) / 2,
        y,
        size: BODY_SIZE,
        font,
        color: TEXT_COLOR,
      });
    }
  }

  // Título
  ensureSpace(LINE_HEIGHT + 10);
  page.drawText("CONTRATO DE LOCAÇÃO DE BENS E EQUIPAMENTOS", {
    x: MARGIN,
    y,
    size: 13,
    font: fontBold,
    color: TEXT_COLOR,
  });
  y -= LINE_HEIGHT + 8;

  const blocks: Block[] = [
    {
      type: "paragraph",
      text:
        `Pelo presente instrumento particular de Contrato de Locação de Bens e Equipamentos, de um lado Empresa ${LOCADOR.nomeEmpresa}, com sede na cidade de Sobral - CE, ${LOCADOR.enderecoEmpresa}, inscrita no CNPJ sob o nº ${LOCADOR.cnpj}, neste ato representada pelo seu diretor Sr. ${LOCADOR.representante}, ${LOCADOR.qualificacaoRepresentante}, residente na ${LOCADOR.enderecoRepresentante}, portador do CPF nº ${LOCADOR.cpfRepresentante}, aqui denominado de LOCADOR. Do outro lado o(a) ${data.nomePaciente}, residente na Rua: ${data.enderecoPaciente}, ${data.cidadePaciente} - CE, portador(a) do CPF: ${data.cpfPaciente}, RG: ${data.rgPaciente}, aqui denominado de LOCATÁRIO, têm entre si justo e contratado o que se segue:`,
    },
    { type: "heading", text: "CLÁUSULA PRIMEIRA: DO OBJETO" },
    {
      type: "paragraph",
      text: `O objeto do presente contrato trata-se de um equipamento modelo ${data.equipamentoTipo} com nº de série ${data.equipamentoSerie}.`,
    },
    { type: "heading", text: "CLÁUSULA TERCEIRA: DO VALOR" },
    {
      type: "paragraph",
      text: `O LOCATÁRIO compromete-se a pagar pela locação o equivalente a R$${formatMoney(
        data.valorMensal
      )} mensalmente.`,
    },
    { type: "heading", text: "CLÁUSULA QUARTA: DA RESTITUIÇÃO" },
    {
      type: "paragraph",
      text: "O LOCATÁRIO fica obrigado a zelar pelos bens e equipamentos descritos na cláusula primeira, sendo que qualquer modificação deverá ser autorizada pelo LOCADOR, e a restituí-los em perfeitas condições, no final deste contrato.",
    },
    {
      type: "paragraph",
      text: "Parágrafo único: No caso de destruição ou perda dos bens ou equipamentos, fica o LOCATÁRIO obrigado a repor o item, ou pagar o valor equivalente ao mesmo.",
    },
    { type: "heading", text: "CLÁUSULA QUINTA: DOS ENCARGOS" },
    {
      type: "paragraph",
      text: "Acontecendo atrasos no pagamento da mensalidade incidirá juros de 2% ao mês mais 0,033% ao dia.",
    },
    {
      type: "paragraph",
      text: "Parágrafo Primeiro: Acontecendo atrasos superiores a 45 (quarenta e cinco) dias o equipamento será recolhido pelo LOCADOR.",
    },
    { type: "heading", text: "CLÁUSULA SEXTA: DO PRAZO" },
    {
      type: "paragraph",
      text: `O presente contrato tem prazo de duração de 1 MÊS com início em ${formatDate(
        data.dataInicio
      )} e término em ${formatDate(
        data.dataTermino
      )}, prazo esse que poderá ser prorrogado de acordo com a necessidade do LOCATÁRIO.`,
    },
    { type: "heading", text: "CLÁUSULA SÉTIMA: DAS DISPOSIÇÕES GERAIS" },
    {
      type: "paragraph",
      text: "O LOCATÁRIO não poderá sublocar os bens ou equipamentos sem a expressa autorização do LOCADOR, e terá o direito de preferência na compra dos objetos desta locação, caso o LOCADOR pretenda vendê-los.",
    },
    {
      type: "paragraph",
      text: "O LOCADOR realizará uma consulta com o LOCATÁRIO para que o mesmo aprenda a manusear o equipamento objeto deste contrato.",
    },
    { type: "heading", text: "CLÁUSULA OITAVA: DO FORO" },
    {
      type: "paragraph",
      text: "Para dirimir questões que direta ou indiretamente decorram deste contrato, as partes elegem o foro desta Comarca de Sobral, com renúncia expressa de qualquer outro, por mais privilegiado que seja.",
    },
    { type: "center", text: `Sobral - CE, ${formatDate(data.dataContrato)}` },
    { type: "signature", nome: LOCADOR.nomeEmpresa, papel: LOCADOR.representante },
    { type: "signature", nome: data.nomePaciente, papel: "LOCATÁRIO" },
  ];

  for (const block of blocks) {
    if (block.type === "heading") drawHeading(block.text);
    else if (block.type === "paragraph") drawParagraph(block.text);
    else if (block.type === "center") drawCenter(block.text);
    else if (block.type === "signature") drawSignature(block.nome, block.papel);
  }

  return pdfDoc.save();
}
