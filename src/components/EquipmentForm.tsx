"use client";

import { useActionState } from "react";
import type { Equipment } from "@prisma/client";
import { EQUIPMENT_STATUS, EQUIPMENT_STATUS_LABELS } from "@/lib/constants";
import type { EquipmentFormState } from "@/lib/actions/equipment";

type Action = (
  prevState: EquipmentFormState,
  formData: FormData
) => Promise<EquipmentFormState>;

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export default function EquipmentForm({
  action,
  equipment,
  submitLabel = "Salvar",
}: {
  action: Action;
  equipment?: Equipment;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Número de série *
        </label>
        <input
          name="numeroSerie"
          defaultValue={equipment?.numeroSerie}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Tipo *</label>
        <input
          name="tipo"
          defaultValue={equipment?.tipo}
          required
          placeholder="Ex: CPAP AUTO RESMED"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Status</label>
        <select
          name="status"
          defaultValue={equipment?.status ?? "DISPONIVEL"}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {EQUIPMENT_STATUS.map((s) => (
            <option key={s} value={s}>
              {EQUIPMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Horas de uso (manutenção)
        </label>
        <input
          name="manutencaoHoras"
          type="number"
          min={0}
          defaultValue={equipment?.manutencaoHoras ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Tipo de manutenção
        </label>
        <input
          name="tipoManutencao"
          defaultValue={equipment?.tipoManutencao ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Data da manutenção
        </label>
        <input
          name="dataManutencao"
          type="date"
          defaultValue={toDateInput(equipment?.dataManutencao)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-slate-700">
          Observações
        </label>
        <textarea
          name="obs"
          defaultValue={equipment?.obs ?? ""}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {state.error && (
        <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {pending ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
