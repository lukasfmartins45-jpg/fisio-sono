"use client";

import { useActionState } from "react";
import { createStockItemAction, type StockFormState } from "@/lib/actions/estoque";
import { STOCK_CATEGORIAS, STOCK_CATEGORIA_LABELS } from "@/lib/constants";

const initialState: StockFormState = {};

export default function NewStockItemForm() {
  const [state, formAction, pending] = useActionState(
    createStockItemAction,
    initialState
  );

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Categoria</label>
        <select
          name="categoria"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {STOCK_CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {STOCK_CATEGORIA_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-slate-700">Nome</label>
        <input
          name="nome"
          required
          placeholder="Ex: Mentoneira tamanho G"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Marca</label>
        <input
          name="marca"
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
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        >
          {pending ? "Adicionando..." : "Adicionar novo tipo de material"}
        </button>
      </div>
    </form>
  );
}
