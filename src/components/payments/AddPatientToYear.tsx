"use client";

import { useState, useTransition } from "react";
import { addPatientToYearAction } from "@/lib/actions/payments";

export default function AddPatientToYear({
  ano,
  patients,
}: {
  ano: number;
  patients: { id: string; nome: string }[];
}) {
  const [selected, setSelected] = useState("");
  const [pending, startTransition] = useTransition();

  if (patients.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">Selecione um paciente...</option>
        {patients.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!selected || pending}
        onClick={() => {
          startTransition(async () => {
            await addPatientToYearAction(selected, ano);
            setSelected("");
          });
        }}
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        Adicionar a {ano}
      </button>
    </div>
  );
}
