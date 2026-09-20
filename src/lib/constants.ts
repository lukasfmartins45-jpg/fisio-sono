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
