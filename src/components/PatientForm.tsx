"use client";

import { useActionState, useState } from "react";
import type { Patient, Equipment, StockItem } from "@prisma/client";
import {
  ADESAO_TERAPIA,
  ADESAO_TERAPIA_LABELS,
  CPAP_TIPOS_VENDA,
} from "@/lib/constants";
import type { PatientFormState } from "@/lib/actions/patients";

type Action = (
  prevState: PatientFormState,
  formData: FormData
) => Promise<PatientFormState>;

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export default function PatientForm({
  action,
  patient,
  equipments,
  mascaraOptions,
  submitLabel = "Salvar",
}: {
  action: Action;
  patient?: Patient;
  equipments: Equipment[];
  mascaraOptions?: StockItem[];
  submitLabel?: string;
}) {
  const [cpapVenda, setCpapVenda] = useState("NENHUM");
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="grid max-w-3xl gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-slate-700">Nome *</label>
        <input
          name="nome"
          defaultValue={patient?.nome}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-slate-700">
          Endereço completo
        </label>
        <input
          name="endereco"
          defaultValue={patient?.endereco ?? ""}
          placeholder="Ex: Rua Coronel Antonio Frota, 410 - Centro"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-400">
          Usado no contrato de locação (rua, número e bairro — a cidade é o campo abaixo).
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Cidade</label>
        <input
          name="cidade"
          defaultValue={patient?.cidade ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">CPF</label>
        <input
          name="cpf"
          defaultValue={patient?.cpf ?? ""}
          placeholder="000.000.000-00"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">RG</label>
        <input
          name="rg"
          defaultValue={patient?.rg ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          WhatsApp do paciente
        </label>
        <input
          name="telefone"
          defaultValue={patient?.telefone ?? ""}
          placeholder="(88) 99999-9999"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-400">
          Usado para enviar o lembrete de cobrança mensal.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Adesão à terapia
        </label>
        <select
          name="adesaoTerapia"
          defaultValue={patient?.adesaoTerapia ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">—</option>
          {ADESAO_TERAPIA.map((a) => (
            <option key={a} value={a}>
              {ADESAO_TERAPIA_LABELS[a]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Início da locação
        </label>
        <input
          name="inicioLocacao"
          type="date"
          defaultValue={toDateInput(patient?.inicioLocacao)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Fim da locação
        </label>
        <input
          name="fimLocacao"
          type="date"
          defaultValue={toDateInput(patient?.fimLocacao)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-400">
          Deixe em branco enquanto a locação estiver ativa.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Aparelho locado
        </label>
        <input
          name="aparelhoLocado"
          defaultValue={patient?.aparelhoLocado ?? ""}
          placeholder="Ex: CPAP AUTO RESMED"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Identificação do aparelho
        </label>
        <input
          name="identificacaoAparelho"
          defaultValue={patient?.identificacaoAparelho ?? ""}
          placeholder="Número de série / DN"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Equipamento vinculado (inventário)
        </label>
        <select
          name="equipmentId"
          defaultValue={patient?.equipmentId ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">— Nenhum —</option>
          {equipments.map((e) => (
            <option key={e.id} value={e.id}>
              {e.numeroSerie} ({e.tipo})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Compra do CPAP
        </label>
        <input
          name="compraCpap"
          defaultValue={patient?.compraCpap ?? ""}
          placeholder="Ex: DA EMPRESA"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Data de entrega do equipamento
        </label>
        <input
          name="dataEntregaEquipamento"
          type="date"
          defaultValue={toDateInput(patient?.dataEntregaEquipamento)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Dispositivo
        </label>
        <input
          name="dispositivo"
          defaultValue={patient?.dispositivo ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Nº de série do aparelho entregue
        </label>
        <input
          name="nsAparelhoEntregue"
          defaultValue={patient?.nsAparelhoEntregue ?? ""}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-slate-700">
          Observações
        </label>
        <textarea
          name="observacoes"
          defaultValue={patient?.observacoes ?? ""}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {!patient && mascaraOptions && (
        <div className="sm:col-span-2 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">
            Material entregue no cadastro (sai do estoque automaticamente)
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Máscara entregue
              </label>
              <select
                name="mascaraStockItemId"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">— Nenhuma —</option>
                {mascaraOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="entregouTubo" value="1" />
                Entregou tubo de CPAP
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Venda de CPAP
              </label>
              <select
                name="cpapVendaTipo"
                value={cpapVenda}
                onChange={(e) => setCpapVenda(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="NENHUM">Não vendeu CPAP</option>
                <option value="NOVO">Vendeu CPAP novo</option>
                <option value="USADO">Vendeu CPAP usado</option>
              </select>
            </div>
          </div>
          {cpapVenda !== "NENHUM" && (
            <div className="sm:w-1/3">
              <label className="block text-sm font-medium text-slate-700">
                Modelo do CPAP vendido
              </label>
              <select
                name="cpapVendaModelo"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">— Selecione —</option>
                {CPAP_TIPOS_VENDA.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {state.error && (
        <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
