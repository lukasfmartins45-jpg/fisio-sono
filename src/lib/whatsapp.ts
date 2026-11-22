const GRAPH_API_VERSION = "v21.0";

export type WhatsAppSendResult =
  | { ok: true }
  | { ok: false; error: string };

/** Remove tudo que não é dígito e garante o código do país (55) na frente. */
export function normalizePhoneToE164Digits(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

/**
 * Envia um template aprovado do WhatsApp Business (Meta Cloud API) para o
 * número informado. Exige as variáveis de ambiente WHATSAPP_ACCESS_TOKEN e
 * WHATSAPP_PHONE_NUMBER_ID configuradas (ver .env.example).
 */
export async function sendWhatsAppTemplate(
  toRaw: string,
  bodyParams: string[]
): Promise<WhatsAppSendResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "lembrete_pagamento";
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || "pt_BR";

  if (!accessToken || !phoneNumberId) {
    return {
      ok: false,
      error:
        "WhatsApp não configurado (faltam WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID).",
    };
  }

  const to = normalizePhoneToE164Digits(toRaw);
  if (!to) {
    return { ok: false, error: "Telefone inválido." };
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            {
              type: "body",
              parameters: bodyParams.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `Falha no envio (HTTP ${res.status}): ${body}` };
  }

  return { ok: true };
}
