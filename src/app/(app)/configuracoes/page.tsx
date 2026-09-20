import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import CreateUserForm from "@/components/CreateUserForm";
import DeleteUserButton from "@/components/DeleteUserButton";

export default async function ConfiguracoesPage() {
  const session = await getSession();
  const isAdmin = session.role === "ADMIN";

  const users = isAdmin
    ? await prisma.user.findMany({ orderBy: { createdAt: "asc" } })
    : [];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500">
          Gerencie sua conta{isAdmin ? " e os usuários do sistema" : ""}.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Trocar minha senha
        </h2>
        <ChangePasswordForm />
      </section>

      {isAdmin && (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Novo usuário
            </h2>
            <CreateUserForm />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Usuários cadastrados
            </h2>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Nome</th>
                    <th className="px-4 py-2">E-mail</th>
                    <th className="px-4 py-2">Perfil</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2 text-slate-500">{u.email}</td>
                      <td className="px-4 py-2">{u.role}</td>
                      <td className="px-4 py-2 text-right">
                        {u.id !== session.userId && (
                          <DeleteUserButton userId={u.id} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
