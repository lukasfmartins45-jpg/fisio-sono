import Link from "next/link";
import EquipmentForm from "@/components/EquipmentForm";
import { createEquipmentAction } from "@/lib/actions/equipment";

export default function NovoEquipamentoPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/equipamentos" className="text-sm text-teal-700 hover:underline">
          &larr; Voltar
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">
          Novo equipamento
        </h1>
      </div>
      <EquipmentForm action={createEquipmentAction} submitLabel="Cadastrar" />
    </div>
  );
}
