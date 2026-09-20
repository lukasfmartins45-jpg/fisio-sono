"use client";

import { useTransition } from "react";
import { setMonthlyPaymentAction } from "@/lib/actions/payments";
import { PAYMENT_STATUS_COLORS, type PaymentStatus } from "@/lib/constants";

export default function PaymentCell({
  rentalPeriodId,
  mes,
  status,
}: {
  rentalPeriodId: string;
  mes: number;
  status: string | null;
}) {
  const [pending, startTransition] = useTransition();

  const colorClass = status
    ? PAYMENT_STATUS_COLORS[status as PaymentStatus] ?? ""
    : "bg-white text-slate-400";

  return (
    <select
      value={status ?? ""}
      disabled={pending}
      onChange={(e) => {
        startTransition(() => {
          setMonthlyPaymentAction(rentalPeriodId, mes, e.target.value);
        });
      }}
      className={`w-full rounded-md border-0 px-1.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 ${colorClass}`}
    >
      <option value="">—</option>
      <option value="PAGO">Pago</option>
      <option value="PENDENTE">Pendente</option>
      <option value="CORTESIA">Cortesia</option>
    </select>
  );
}
