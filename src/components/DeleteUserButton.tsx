"use client";

import { useTransition } from "react";
import { deleteUserAction } from "@/lib/actions/users";

export default function DeleteUserButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Excluir este usuário?")) {
          startTransition(() => deleteUserAction(userId));
        }
      }}
      className="text-sm text-red-600 hover:underline disabled:opacity-60"
    >
      Excluir
    </button>
  );
}
