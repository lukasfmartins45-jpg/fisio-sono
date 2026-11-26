import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CPAP_TIPOS_VENDA, MASCARA_MODELOS } from "../src/lib/constants";

const prisma = new PrismaClient();

function marcaDoCpap(tipo: string): string {
  if (tipo.includes("RESMED")) return "Resmed";
  if (tipo.includes("PHILIPS")) return "Philips Respironics";
  if (tipo.includes("YUWELL")) return "Yuwell";
  if (tipo.includes("BMC")) return "BMC";
  return "Outro";
}

async function main() {
  const email = "admin@fisiosono.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash("fisiosono123", 10);
    await prisma.user.create({
      data: {
        name: "Administrador",
        email,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`Usuário admin criado: ${email} / senha: fisiosono123`);
    console.log("Troque a senha em Configurações após o primeiro acesso.");
  } else {
    console.log("Usuário admin já existe, nada a fazer.");
  }

  const defaultPrices: { ano: number; valor: number }[] = [
    { ano: 2023, valor: 350 },
    { ano: 2024, valor: 370 },
    { ano: 2025, valor: 370 },
    { ano: 2026, valor: 370 },
  ];
  for (const p of defaultPrices) {
    await prisma.priceTable.upsert({
      where: { ano: p.ano },
      update: {},
      create: p,
    });
  }
  console.log("Tabela de preços padrão garantida.");

  for (const { nome, marca } of MASCARA_MODELOS) {
    await prisma.stockItem.upsert({
      where: { categoria_nome: { categoria: "MASCARA", nome } },
      update: {},
      create: { categoria: "MASCARA", nome, marca },
    });
  }
  await prisma.stockItem.upsert({
    where: { categoria_nome: { categoria: "TUBO", nome: "Tubo de CPAP" } },
    update: {},
    create: { categoria: "TUBO", nome: "Tubo de CPAP" },
  });
  await prisma.stockItem.upsert({
    where: { categoria_nome: { categoria: "MENTONEIRA", nome: "Mentoneira" } },
    update: {},
    create: { categoria: "MENTONEIRA", nome: "Mentoneira" },
  });
  for (const tipo of CPAP_TIPOS_VENDA) {
    const marca = marcaDoCpap(tipo);
    for (const categoria of ["CPAP_NOVO", "CPAP_USADO"] as const) {
      await prisma.stockItem.upsert({
        where: { categoria_nome: { categoria, nome: tipo } },
        update: {},
        create: { categoria, nome: tipo, marca },
      });
    }
  }
  console.log("Catálogo padrão de estoque garantido.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
