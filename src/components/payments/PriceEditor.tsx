"use client";

import { useState, useTransition } from "react";
import { updatePriceAction } from "@/lib/actions/payments";

export default function PriceEditor({ ano, valor }: { ano: number; valor: number }) {
  const [value, setValue] = useState(String(valor || ""));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span>Valor da mensalidade em {ano}: R$</span>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm"
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const num = Number(value);
          if (isNaN(num) || num < 0) return;
          startTransition(async () => {
            await updatePriceAction(ano, num);
            setSaved(true);
          });
        }}
        className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-60"
      >
        Salvar
      </button>
      {saved && <span className="text-green-600">Salvo.</span>}
    </div>
  );
}
