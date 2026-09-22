"use client";

import { useState } from "react";
import { MESES } from "@/lib/constants";

type AnoData = { ano: number; meses: number[] };

const YEAR_COLORS = [
  "bg-slate-300",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-violet-400",
  "bg-sky-500",
];

export default function NewPatientsChart({ data }: { data: AnoData[] }) {
  const anos = data.map((d) => d.ano);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set(anos));

  const visiveis = data.filter((d) => selecionados.has(d.ano));
  const max = Math.max(1, ...visiveis.flatMap((d) => d.meses));

  function toggle(ano: number) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(ano)) {
        if (next.size > 1) next.delete(ano);
      } else {
        next.add(ano);
      }
      return next;
    });
  }

  if (data.length === 0) {
    return <p className="text-sm text-slate-400">Sem dados suficientes ainda.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {anos.map((ano, i) => {
          const active = selecionados.has(ano);
          const colorClass = YEAR_COLORS[i % YEAR_COLORS.length];
          return (
            <button
              key={ano}
              type="button"
              onClick={() => toggle(ano)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                active
                  ? "border-slate-300 bg-white text-slate-700"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${active ? colorClass : "bg-slate-300"}`} />
              {ano}
            </button>
          );
        })}
      </div>

      <div
        className="grid grid-cols-12 items-end gap-2 overflow-x-auto"
        style={{ height: 180 }}
      >
        {MESES.map((mesLabel, mesIndex) => (
          <div key={mesLabel} className="flex h-full flex-col items-center justify-end gap-1">
            <div className="flex h-full w-full items-end justify-center gap-0.5">
              {visiveis.map((d) => {
                const anoIndex = anos.indexOf(d.ano);
                const total = d.meses[mesIndex];
                return (
                  <div
                    key={d.ano}
                    className={`w-full rounded-t ${YEAR_COLORS[anoIndex % YEAR_COLORS.length]}`}
                    style={{ height: total > 0 ? `${(total / max) * 100}%` : 2 }}
                    title={`${d.ano}: ${total} novo(s) paciente(s) em ${mesLabel}`}
                  />
                );
              })}
            </div>
            <span className="text-[10px] text-slate-400">{mesLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
