"use client";

import { useActionState } from "react";
import { registerStockEntryAction, type StockFormState } from "@/lib/actions/estoque";
import { STOCK_CATEGORIA_LABELS, type StockCategoria } from "@/lib/constants";

type Item = { id: string; nome: string; categoria: string };

const initialState: StockFormState = {};

export default function StockEntryForm({ items }: { items: Item[] }) {
  const [state, formAction, pending] = useActionState(
    registerStockEntryAction,
    initialState
  );

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      <div className="sm:col-span-2">
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
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Observação</label>
        <input
          name="motivo"
          placeholder="Ex: compra do fornecedor X"
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
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Lançando..." : "Lançar entrada"}
        </button>
      </div>
    </form>
  );
}
