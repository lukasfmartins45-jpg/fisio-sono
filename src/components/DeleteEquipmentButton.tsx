"use client";

import { useTransition } from "react";
import { deleteEquipmentAction } from "@/lib/actions/equipment";

export default function DeleteEquipmentButton({
  equipmentId,
}: {
  equipmentId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            "Excluir este equipamento? Pacientes vinculados perderão a referência."
          )
        ) {
          startTransition(() => deleteEquipmentAction(equipmentId));
        }
      }}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
    >
      Excluir
    </button>
  );
}
