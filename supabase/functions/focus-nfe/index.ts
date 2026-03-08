import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Produção ativa com certificado válido até 03/03/2027
const FOCUS_BASE_URL = "https://api.focusnfe.com.br";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const FOCUS_TOKEN = Deno.env.get("FOCUS_NFE_TOKEN");
  if (!FOCUS_TOKEN) {
    return new Response(JSON.stringify({ error: "FOCUS_NFE_TOKEN não configurado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  // Check admin
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Acesso negado" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authB64 = btoa(`${FOCUS_TOKEN}:`);

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "emit") {
      return await handleEmit(supabase, body, authB64, userId);
    } else if (action === "query") {
      return await handleQuery(supabase, body, authB64);
    } else if (action === "cancel") {
      return await handleCancel(supabase, body, authB64);
    } else if (action === "list") {
      return await handleList(supabase);
    } else {
      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Focus NFe error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleEmit(
  supabase: ReturnType<typeof createClient>,
  body: any,
  authB64: string,
  userId: string
) {
  const { customerName, customerCpf, customerEmail, items, total, notes, orderId } = body;

  const ref = `NF-${Date.now().toString(36).toUpperCase()}`;

  // Build NF-e payload for Focus NFe API
  const nfeData: Record<string, any> = {
    natureza_operacao: "Venda de mercadoria",
    forma_pagamento: "0", // à vista
    tipo_documento: "1", // saída
    finalidade_emissao: "1", // normal
    consumidor_final: "1",
    presenca_comprador: "9", // outros
    nome_destinatario: customerName || "CONSUMIDOR FINAL",
    cpf_destinatario: customerCpf?.replace(/\D/g, "") || undefined,
    indicador_inscricao_estadual_destinatario: "9",
    items: items.map((item: any, idx: number) => ({
      numero_item: idx + 1,
      codigo_produto: item.code || `PROD-${idx + 1}`,
      descricao: item.name,
      quantidade_comercial: item.quantity.toFixed(4),
      quantidade_tributavel: item.quantity.toFixed(4),
      valor_unitario_comercial: item.price.toFixed(2),
      valor_unitario_tributavel: item.price.toFixed(2),
      valor_bruto: (item.price * item.quantity).toFixed(2),
      unidade_comercial: "UN",
      unidade_tributavel: "UN",
      codigo_ncm: "7323.93.00", // generic metal container NCM
      cfop: "5102",
      icms_situacao_tributaria: "102",
      icms_origem: "0",
      pis_situacao_tributaria: "07",
      cofins_situacao_tributaria: "07",
    })),
    formas_pagamento: [
      {
        tipo_pagamento: "01",
        valor_pagamento: total.toFixed(2),
      },
    ],
  };

  if (customerEmail) {
    nfeData.email_destinatario = customerEmail;
  }

  // Call Focus NFe API
  const focusRes = await fetch(`${FOCUS_BASE_URL}/v2/nfe?ref=${ref}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authB64}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(nfeData),
  });

  const focusResult = await focusRes.json();

  const status = focusRes.ok ? "processing" : "error";
  const errorMessage = focusRes.ok ? null : (focusResult.mensagem || JSON.stringify(focusResult));

  // Save to database
  const { data: savedNote, error: dbError } = await supabase
    .from("fiscal_notes")
    .insert({
      order_id: orderId || null,
      type: "nfe",
      status,
      focus_ref: ref,
      customer_name: customerName,
      customer_cpf: customerCpf,
      customer_email: customerEmail,
      total,
      items,
      notes,
      error_message: errorMessage,
      created_by: userId,
    })
    .select()
    .single();

  if (dbError) {
    throw new Error(`Erro ao salvar nota: ${dbError.message}`);
  }

  return new Response(
    JSON.stringify({ success: focusRes.ok, note: savedNote, focusResult }),
    { status: focusRes.ok ? 200 : 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleQuery(
  supabase: ReturnType<typeof createClient>,
  body: any,
  authB64: string
) {
  const { noteId, focusRef } = body;

  const focusRes = await fetch(`${FOCUS_BASE_URL}/v2/nfe/${focusRef}`, {
    method: "GET",
    headers: { Authorization: `Basic ${authB64}` },
  });

  const focusResult = await focusRes.json();

  // Update local record
  const updateData: Record<string, any> = {};

  if (focusResult.status === "autorizado") {
    updateData.status = "authorized";
    updateData.number = focusResult.numero;
    updateData.series = focusResult.serie;
    updateData.access_key = focusResult.chave_nfe;
    updateData.xml_url = focusResult.caminho_xml_nota_fiscal;
    updateData.pdf_url = focusResult.caminho_danfe;
  } else if (focusResult.status === "erro_autorizacao") {
    updateData.status = "error";
    updateData.error_message = focusResult.mensagem_sefaz || focusResult.mensagem;
  } else if (focusResult.status === "cancelado") {
    updateData.status = "cancelled";
    updateData.cancel_xml_url = focusResult.caminho_xml_cancelamento;
  } else if (focusResult.status === "processando_autorizacao") {
    updateData.status = "processing";
  }

  if (Object.keys(updateData).length > 0) {
    await supabase.from("fiscal_notes").update(updateData).eq("id", noteId);
  }

  return new Response(
    JSON.stringify({ focusResult, updateData }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCancel(
  supabase: ReturnType<typeof createClient>,
  body: any,
  authB64: string
) {
  const { noteId, focusRef, justificativa } = body;

  const focusRes = await fetch(`${FOCUS_BASE_URL}/v2/nfe/${focusRef}`, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${authB64}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ justificativa: justificativa || "Cancelamento solicitado pelo emissor" }),
  });

  const focusResult = await focusRes.json();

  if (focusRes.ok) {
    await supabase.from("fiscal_notes").update({ status: "cancelled" }).eq("id", noteId);
  }

  return new Response(
    JSON.stringify({ success: focusRes.ok, focusResult }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleList(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("fiscal_notes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  return new Response(JSON.stringify({ notes: data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
