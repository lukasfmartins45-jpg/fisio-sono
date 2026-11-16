"use client";

import { useActionState } from "react";
import { restoreBackupAction, type BackupFormState } from "@/lib/actions/backup";

const initialState: BackupFormState = {};

export default function RestoreBackupForm() {
  const [state, formAction, pending] = useActionState(
    restoreBackupAction,
    initialState
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "Isso vai SUBSTITUIR todos os dados atuais (pacientes, equipamentos, pagamentos) pelos do arquivo de backup. Essa ação não pode ser desfeita. Continuar?"
          )
        ) {
          e.preventDefault();
        }
      }}
      className="max-w-md space-y-3"
    >
      <input
        type="file"
        name="backup"
        accept=".db"
        required
        className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
      />
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Restaurando..." : "Restaurar este backup"}
      </button>
    </form>
  );
}
