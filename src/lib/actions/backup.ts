"use server";

import fs from "node:fs";
import { getSession } from "@/lib/session";
import { resolveDatabasePath } from "@/lib/db-path";

export type BackupFormState = { error?: string; success?: string };

const SQLITE_MAGIC = "SQLite format 3\0";

export async function restoreBackupAction(
  _prevState: BackupFormState,
  formData: FormData
): Promise<BackupFormState> {
  const session = await getSession();
  if (!session.userId || session.role !== "ADMIN") {
    return { error: "Apenas administradores podem restaurar backups." };
  }

  const file = formData.get("backup");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo de backup (.db)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const header = buffer.subarray(0, SQLITE_MAGIC.length).toString("utf8");
  if (header !== SQLITE_MAGIC) {
    return {
      error:
        "Esse arquivo não parece ser um backup válido do banco de dados (formato SQLite não reconhecido).",
    };
  }

  const dbPath = resolveDatabasePath();
  const tmpPath = `${dbPath}.restoring-${Date.now()}`;

  fs.writeFileSync(tmpPath, buffer);
  fs.renameSync(tmpPath, dbPath);
  for (const suffix of ["-journal", "-wal", "-shm"]) {
    const sidecar = `${dbPath}${suffix}`;
    if (fs.existsSync(sidecar)) fs.rmSync(sidecar);
  }

  // Força o processo a reiniciar para abrir conexões limpas com o novo
  // arquivo. Em produção (Railway) o serviço reinicia sozinho; localmente é
  // preciso rodar "npm start" de novo.
  setTimeout(() => process.exit(0), 300);

  return {
    success:
      "Backup restaurado! O sistema vai reiniciar agora — se estiver rodando local, rode \"npm start\" de novo em alguns segundos.",
  };
}
