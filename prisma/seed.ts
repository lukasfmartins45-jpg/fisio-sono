import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
