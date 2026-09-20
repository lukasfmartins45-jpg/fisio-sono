"use client";

import { useTransition } from "react";
import { setRentalStatusAction } from "@/lib/actions/payments";
import { RENTAL_STATUS, RENTAL_STATUS_LABELS } from "@/lib/constants";

export default function RentalStatusSelect({
  rentalPeriodId,
  status,
}: {
  rentalPeriodId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        startTransition(() => {
          setRentalStatusAction(rentalPeriodId, e.target.value);
        });
      }}
      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
    >
      {RENTAL_STATUS.map((s) => (
        <option key={s} value={s}>
          {RENTAL_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
