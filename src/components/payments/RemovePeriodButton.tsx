"use client";

import { useTransition } from "react";
import { removeRentalPeriodAction } from "@/lib/actions/payments";

export default function RemovePeriodButton({
  rentalPeriodId,
}: {
  rentalPeriodId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      title="Remover paciente deste ano"
      onClick={() => {
        if (confirm("Remover este paciente do ano selecionado? Os pagamentos registrados serão apagados.")) {
          startTransition(() => removeRentalPeriodAction(rentalPeriodId));
        }
      }}
      className="text-xs text-red-500 hover:underline disabled:opacity-60"
    >
      remover
    </button>
  );
}
