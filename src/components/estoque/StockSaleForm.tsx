"use client";

import { useActionState } from "react";
import { registerStockSaleAction, type StockFormState } from "@/lib/actions/estoque";
import { STOCK_CATEGORIA_LABELS, type StockCategoria } from "@/lib/constants";

type Item = { id: string; nome: string; categoria: string };
type PatientOption = { id: string; nome: string };

const initialState: StockFormState = {};

export default function StockSaleForm({
  items,
  patients,
  fixedPatientId,
}: {
  items: Item[];
  patients?: PatientOption[];
  fixedPatientId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    registerStockSaleAction,
    initialState
  );

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      {fixedPatientId && <input type="hidden" name="patientId" value={fixedPatientId} />}
      <div className={fixedPatientId ? "sm:col-span-2" : "sm:col-span-2"}>
        <label className="block text-sm font-medium text-slate-700">Material</label>
        <select
          name="stockItemId"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">— Selecione —</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              [{STOCK_CATEGORIA_LABELS[i.categoria as StockCategoria] ?? i.categoria}] {i.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Quantidade</label>
        <input
          name="quantidade"
          type="number"
          min={1}
          defaultValue={1}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {!fixedPatientId && (
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Paciente (opcional)
          </label>
          <input
            name="patientNome"
            list="pacientes-estoque"
            placeholder="Digite o nome do paciente..."
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <datalist id="pacientes-estoque">
            {patients?.map((p) => (
              <option key={p.id} value={p.nome} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-slate-400">
            Escolha o nome exatamente como aparece na lista sugerida.
          </p>
        </div>
      )}
      <div className="sm:col-span-4">
        <label className="block text-sm font-medium text-slate-700">Observação</label>
        <input
          name="motivo"
          placeholder="Ex: entregue na locação, venda em retorno..."
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {state.error && (
        <p className="sm:col-span-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="sm:col-span-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
      )}

      <div className="sm:col-span-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {pending ? "Registrando..." : "Registrar saída/venda"}
        </button>
      </div>
    </form>
  );
}
