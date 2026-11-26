import { prisma } from "@/lib/prisma";
import {
  listStockItemsByCategoria,
  listTopSellers,
  listRecentMovements,
} from "@/lib/estoque";
import { STOCK_CATEGORIAS, STOCK_CATEGORIA_LABELS } from "@/lib/constants";
import StockEntryForm from "@/components/estoque/StockEntryForm";
import StockSaleForm from "@/components/estoque/StockSaleForm";
import NewStockItemForm from "@/components/estoque/NewStockItemForm";

export default async function EstoquePage() {
  const [byCategoria, maisVendidasMascaras, maisVendidosCpapNovo, maisVendidosCpapUsado, recentes, patients] =
    await Promise.all([
      listStockItemsByCategoria(),
      listTopSellers("MASCARA"),
      listTopSellers("CPAP_NOVO"),
      listTopSellers("CPAP_USADO"),
      listRecentMovements(),
      prisma.patient.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    ]);

  const allItems = STOCK_CATEGORIAS.flatMap((c) => byCategoria.get(c) ?? []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Estoque</h1>
        <p className="text-sm text-slate-500">
          Máscaras, tubos, mentoneiras e CPAP novo/usado à venda. Separado do
          inventário de CPAPs de locação (aba Equipamentos).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TopSellersCard titulo="Máscaras mais vendidas" dados={maisVendidasMascaras} />
        <TopSellersCard titulo="CPAP novo mais vendido" dados={maisVendidosCpapNovo} />
        <TopSellersCard titulo="CPAP usado mais vendido" dados={maisVendidosCpapUsado} />
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Quantidade em estoque
        </h2>
        {STOCK_CATEGORIAS.map((categoria) => {
          const items = byCategoria.get(categoria) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={categoria}>
              <h3 className="mb-2 text-sm font-medium text-slate-700">
                {STOCK_CATEGORIA_LABELS[categoria]}
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Item</th>
                      <th className="px-4 py-2">Marca</th>
                      <th className="px-4 py-2 text-center">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 font-medium text-slate-800">{item.nome}</td>
                        <td className="px-4 py-2 text-slate-500">{item.marca ?? "—"}</td>
                        <td
                          className={`px-4 py-2 text-center font-semibold ${
                            item.quantidade <= 0 ? "text-red-600" : "text-slate-800"
                          }`}
                        >
                          {item.quantidade}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Lançar chegada de material
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <StockEntryForm items={allItems} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Registrar saída / venda avulsa
        </h2>
        <p className="text-xs text-slate-400">
          Use isso para vendas em retorno (ex: paciente já cadastrado compra
          uma máscara nova). Para o material entregue no cadastro de um
          paciente novo, use o próprio formulário de cadastro do paciente.
        </p>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <StockSaleForm items={allItems} patients={patients} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Adicionar novo tipo de material ao catálogo
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <NewStockItemForm />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Movimentações recentes
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Material</th>
                <th className="px-4 py-2 text-center">Qtd</th>
                <th className="px-4 py-2">Paciente</th>
                <th className="px-4 py-2">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentes.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(m.data).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        m.tipo === "ENTRADA"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {m.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-700">{m.stockItem.nome}</td>
                  <td className="px-4 py-2 text-center">{m.quantidade}</td>
                  <td className="px-4 py-2 text-slate-500">{m.patient?.nome ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-400">{m.motivo ?? "—"}</td>
                </tr>
              ))}
              {recentes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Nenhuma movimentação registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TopSellersCard({
  titulo,
  dados,
}: {
  titulo: string;
  dados: { item: { nome: string; marca: string | null }; totalVendido: number }[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{titulo}</h3>
      {dados.length === 0 ? (
        <p className="text-sm text-slate-400">Sem vendas registradas ainda.</p>
      ) : (
        <ol className="space-y-2">
          {dados.map((d, i) => (
            <li key={d.item.nome} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {i + 1}. {d.item.nome}
              </span>
              <span className="font-semibold text-slate-800">{d.totalVendido}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
