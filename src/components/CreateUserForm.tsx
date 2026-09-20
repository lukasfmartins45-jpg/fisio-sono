"use client";

import { useActionState } from "react";
import { createUserAction, type UserFormState } from "@/lib/actions/users";

const initialState: UserFormState = {};

export default function CreateUserForm() {
  const [state, formAction, pending] = useActionState(
    createUserAction,
    initialState
  );

  return (
    <form action={formAction} className="grid max-w-2xl gap-3 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-slate-700">Nome</label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">E-mail</label>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Senha</label>
        <input
          name="password"
          type="password"
          minLength={6}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Perfil</label>
        <select
          name="role"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="USER">Usuário</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>

      {state.error && (
        <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="sm:col-span-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {pending ? "Criando..." : "Criar usuário"}
        </button>
      </div>
    </form>
  );
}
