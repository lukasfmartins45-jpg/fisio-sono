export const EQUIPMENT_STATUS = [
  "DISPONIVEL",
  "EM_LOCACAO",
  "VENDIDO",
  "EM_MANUTENCAO",
] as const;
export type EquipmentStatus = (typeof EQUIPMENT_STATUS)[number];

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  DISPONIVEL: "Disponível",
  EM_LOCACAO: "Em locação",
  VENDIDO: "Vendido",
  EM_MANUTENCAO: "Em manutenção",
};

export const ADESAO_TERAPIA = ["SIM", "NAO", "PRE_OP"] as const;
export type AdesaoTerapia = (typeof ADESAO_TERAPIA)[number];

export const ADESAO_TERAPIA_LABELS: Record<AdesaoTerapia, string> = {
  SIM: "Sim",
  NAO: "Não",
  PRE_OP: "Pré-op",
};

export const RENTAL_STATUS = ["EM_LOCACAO", "FINALIZADO"] as const;
export type RentalStatus = (typeof RENTAL_STATUS)[number];

export const RENTAL_STATUS_LABELS: Record<RentalStatus, string> = {
  EM_LOCACAO: "Em locação",
  FINALIZADO: "Finalizado",
};

export const PAYMENT_STATUS = ["PAGO", "PENDENTE", "CORTESIA"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAGO: "Pago",
  PENDENTE: "Pendente",
  CORTESIA: "Cortesia",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PAGO: "bg-green-100 text-green-800",
  PENDENTE: "bg-amber-100 text-amber-800",
  CORTESIA: "bg-sky-100 text-sky-800",
};

export const STOCK_CATEGORIAS = [
  "MASCARA",
  "TUBO",
  "CPAP_NOVO",
  "CPAP_USADO",
  "MENTONEIRA",
  "OUTRO",
] as const;
export type StockCategoria = (typeof STOCK_CATEGORIAS)[number];

export const STOCK_CATEGORIA_LABELS: Record<StockCategoria, string> = {
  MASCARA: "Máscara",
  TUBO: "Tubo de CPAP",
  CPAP_NOVO: "CPAP novo (venda)",
  CPAP_USADO: "CPAP usado (venda)",
  MENTONEIRA: "Mentoneira",
  OUTRO: "Outro material",
};

export const STOCK_MOVIMENTO_TIPOS = ["ENTRADA", "SAIDA"] as const;
export type StockMovimentoTipo = (typeof STOCK_MOVIMENTO_TIPOS)[number];

// Tipos de CPAP que a clínica também vende (mesmo catálogo usado no
// inventário de locação em Equipamentos).
export const CPAP_TIPOS_VENDA = [
  "CPAP AUTO RESMED",
  "CPAP FIXO RESMED",
  "CPAP AUTO PHILIPS",
  "CPAP AUTO YUWELL",
  "BILEVEL BMC",
] as const;

export const MASCARA_MODELOS = [
  { nome: "Máscara Nasal Wisp - Philips Respironics", marca: "Philips Respironics" },
  { nome: "Máscara Nasal DreamWear - Philips Respironics", marca: "Philips Respironics" },
  { nome: "Máscara Nasal Mirage FX - Resmed", marca: "Resmed" },
  { nome: "Máscara Nasal DreamWear Pillow - Philips Respironics", marca: "Philips Respironics" },
] as const;

export const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export const MESES_LONGOS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;
