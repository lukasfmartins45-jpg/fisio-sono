"use client";

import { useState, useTransition } from "react";
import { sendReminderAction } from "@/lib/actions/cobrancas";

export default function SendReminderButton({
  patientId,
  jaEnviado,
}: {
  patientId: string;
  jaEnviado: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await sendReminderAction(patientId);
            if (result.error) setMessage({ ok: false, text: result.error });
            else setMessage({ ok: true, text: result.success ?? "Enviado." });
          });
        }}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Enviando..." : jaEnviado ? "Reenviar lembrete" : "Enviar lembrete"}
      </button>
      {message && (
        <span className={message.ok ? "text-xs text-emerald-700" : "text-xs text-red-600"}>
          {message.text}
        </span>
      )}
    </div>
  );
}
