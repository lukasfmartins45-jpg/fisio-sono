import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { logoutAction } from "@/lib/actions/auth";
import NavLink from "@/components/NavLink";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pacientes", label: "Pacientes" },
  { href: "/equipamentos", label: "Equipamentos" },
  { href: "/pagamentos", label: "Pagamentos" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.userId) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white sm:flex">
        <div className="px-5 py-5">
          <p className="text-lg font-semibold text-slate-900">Fisio Sono</p>
          <p className="text-xs text-slate-500">Locação de equipamentos</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 px-3 py-4">
          <NavLink href="/configuracoes">Configurações</NavLink>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="text-sm font-medium text-slate-900 sm:hidden">
            Fisio Sono
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-600">{session.name}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                Sair
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
