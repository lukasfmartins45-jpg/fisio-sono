"use client";

import { useTransition } from "react";
import { deletePatientAction } from "@/lib/actions/patients";

export default function DeletePatientButton({ patientId }: { patientId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            "Excluir este paciente? Todo o histórico de pagamentos será apagado."
          )
        ) {
          startTransition(() => deletePatientAction(patientId));
        }
      }}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
    >
      Excluir
    </button>
  );
}
