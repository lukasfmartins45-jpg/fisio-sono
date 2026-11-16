import path from "node:path";

/**
 * Resolve o caminho absoluto do arquivo SQLite a partir de DATABASE_URL
 * (formato "file:./dev.db" ou "file:/caminho/absoluto/dev.db").
 * Um caminho relativo é resolvido em relação à pasta prisma/ (mesma
 * convenção que o próprio Prisma usa para o datasource do schema.prisma).
 */
export function resolveDatabasePath(): string {
  const url = process.env.DATABASE_URL ?? "";
  const filePart = url.replace(/^file:/, "");
  return path.isAbsolute(filePart)
    ? filePart
    : path.join(/* turbopackIgnore: true */ process.cwd(), "prisma", filePart);
}
