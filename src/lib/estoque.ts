import { prisma } from "@/lib/prisma";
import { STOCK_CATEGORIAS, type StockCategoria } from "@/lib/constants";

export async function listStockItemsByCategoria() {
  const items = await prisma.stockItem.findMany({
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });

  const byCategoria = new Map<StockCategoria, typeof items>();
  for (const categoria of STOCK_CATEGORIAS) byCategoria.set(categoria, []);
  for (const item of items) {
    const list = byCategoria.get(item.categoria as StockCategoria);
    if (list) list.push(item);
    else byCategoria.set("OUTRO", [...(byCategoria.get("OUTRO") ?? []), item]);
  }
  return byCategoria;
}

export async function listTopSellers(categoria: StockCategoria, limit = 5) {
  const vendas = await prisma.stockMovement.groupBy({
    by: ["stockItemId"],
    where: { tipo: "SAIDA", stockItem: { categoria } },
    _sum: { quantidade: true },
  });

  const items = await prisma.stockItem.findMany({
    where: { id: { in: vendas.map((v) => v.stockItemId) } },
  });
  const itemById = new Map(items.map((i) => [i.id, i]));

  return vendas
    .map((v) => ({
      item: itemById.get(v.stockItemId)!,
      totalVendido: v._sum.quantidade ?? 0,
    }))
    .filter((v) => v.item)
    .sort((a, b) => b.totalVendido - a.totalVendido)
    .slice(0, limit);
}

export async function listRecentMovements(limit = 30) {
  return prisma.stockMovement.findMany({
    orderBy: { data: "desc" },
    take: limit,
    include: { stockItem: true, patient: { select: { id: true, nome: true } } },
  });
}
