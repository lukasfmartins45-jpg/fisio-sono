import fs from "node:fs";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { resolveDatabasePath } from "@/lib/db-path";

export async function GET() {
  const session = await getSession();
  if (!session.userId || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const dbPath = resolveDatabasePath();
  if (!fs.existsSync(dbPath)) {
    return NextResponse.json(
      { error: "Arquivo do banco de dados não encontrado." },
      { status: 404 }
    );
  }

  const fileBuffer = fs.readFileSync(dbPath);
  const dataHoje = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="backup-fisiosono-${dataHoje}.db"`,
    },
  });
}
