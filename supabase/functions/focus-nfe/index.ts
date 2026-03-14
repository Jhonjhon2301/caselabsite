import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BRASILNFE_BASE_URL = "https://api.brasilnfe.com.br/services/fiscal";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const BRASILNFE_TOKEN = Deno.env.get("BRASILNFE_TOKEN");
  if (!BRASILNFE_TOKEN) {
    return new Response(JSON.stringify({ error: "BRASILNFE_TOKEN não configurado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1);

  if (!roleData || roleData.length === 0) {
    return new Response(JSON.stringify({ error: "Acesso negado" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const headers = {
    Token: BRASILNFE_TOKEN,
    "Content-Type": "application/json",
  };

  try {
    const body = await req.json();
    const { action } = body;
    console.log("Action:", action);

    if (action === "emit") {
      return await handleEmit(supabaseAdmin, body, headers, userId);
    } else if (action === "query") {
      return await handleQuery(supabaseAdmin, body, headers);
    } else if (action === "cancel") {
      return await handleCancel(supabaseAdmin, body, headers);
    } else if (action === "list") {
      return await handleList(supabaseAdmin);
    } else {
      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Brasil NFe error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleEmit(
  supabase: ReturnType<typeof createClient>,
  body: any,
  headers: Record<string, string>,
  userId: string
) {
  const { customerName, customerCpf, customerCnpj, customerEmail, items, total, notes, orderId } = body;
  const cleanCpf = customerCpf?.replace(/\D/g, "") || "";
  const cleanCnpj = customerCnpj?.replace(/\D/g, "") || "";

  const internalRef = `NF-${Date.now().toString(36).toUpperCase()}`;

  // Build payload following official Brasil NFe API docs
  const nfePayload: Record<string, any> = {
    TipoAmbiente: "1",
    ModeloDocumento: 55,
    NaturezaOperacao: "Venda de mercadoria",
    Finalidade: 1,
    ConsumidorFinal: !cleanCnpj,
    IndicadorPresenca: 9,
    CalcularIBPT: true,
    IdentificadorInterno: internalRef,
    Observacao: notes || undefined,
    Cliente: {
      NmCliente: customerName || "CONSUMIDOR FINAL",
      IndicadorIe: 9,
    },
    Produtos: items.map((item: any, idx: number) => ({
      CodProdutoServico: item.code || String(idx + 1).padStart(4, "0"),
      NmProduto: item.name,
      Quantidade: Number(item.quantity),
      ValorUnitario: Number(item.price),
      UnidadeComercial: "UND",
      UnidadeComercialTributavel: "UND",
      NCM: "73239300",
      CFOP: 5102,
      OrigemProduto: 0,
      Imposto: {
        ICMS: {
          CodSituacaoTributaria: "102",
        },
        PIS: {
          CodSituacaoTributaria: "07",
        },
        COFINS: {
          CodSituacaoTributaria: "07",
        },
      },
    })),
    Pagamentos: [
      {
        FormaPagamento: "17",
        VlPago: Number(total),
      },
    ],
  };

  // Set CPF or CNPJ
  if (cleanCnpj) {
    nfePayload.Cliente.CpfCnpj = cleanCnpj;
  } else if (cleanCpf) {
    nfePayload.Cliente.CpfCnpj = cleanCpf;
  }

  if (customerEmail) {
    nfePayload.Cliente.Contato = {
      Email: customerEmail,
    };
  }

  console.log("Emitting NF-e via Brasil NFe, ref:", internalRef);

  const brasilRes = await fetch(`${BRASILNFE_BASE_URL}/EnviarNotaFiscal`, {
    method: "POST",
    headers,
    body: JSON.stringify(nfePayload),
  });

  const brasilResult = await brasilRes.json();
  console.log("Brasil NFe response:", JSON.stringify(brasilResult));

  const returnNF = brasilResult?.ReturnNF || {};
  const hasError = brasilResult?.Error || !brasilRes.ok;
  const isAuthorized = !hasError && returnNF?.Ok === true;
  const status = isAuthorized ? "authorized" : (hasError ? "error" : "processing");
  const errorMessage = brasilResult?.Error || (!brasilRes.ok ? (returnNF?.DsStatusRespostaSefaz || JSON.stringify(brasilResult)) : null);

  // Store PDF if returned
  let pdfUrl: string | null = null;
  if (brasilResult?.Base64File) {
    try {
      const pdfBytes = Uint8Array.from(atob(brasilResult.Base64File), c => c.charCodeAt(0));
      const pdfPath = `nfe-pdfs/${internalRef}.pdf`;
      await supabase.storage.from("designer-files").upload(pdfPath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
      const { data: { publicUrl } } = supabase.storage.from("designer-files").getPublicUrl(pdfPath);
      pdfUrl = publicUrl;
    } catch (e) {
      console.error("Error storing PDF:", e);
    }
  }

  // Save to database
  const { data: savedNote, error: dbError } = await supabase
    .from("fiscal_notes")
    .insert({
      order_id: orderId || null,
      type: "nfe",
      status,
      focus_ref: internalRef,
      customer_name: customerName,
      customer_cpf: cleanCnpj || cleanCpf || null,
      customer_email: customerEmail,
      total,
      number: returnNF?.Numero?.toString() || null,
      series: returnNF?.Serie?.toString() || null,
      access_key: returnNF?.ChaveNF || null,
      pdf_url: pdfUrl,
      items,
      notes,
      error_message: errorMessage,
      created_by: userId,
    })
    .select()
    .single();

  if (dbError) {
    console.error("DB save error:", dbError);
    throw new Error(`Erro ao salvar nota: ${dbError.message}`);
  }

  return new Response(
    JSON.stringify({ success: brasilRes.ok && isAuthorized, note: savedNote, brasilResult: { status, error: errorMessage }, error: errorMessage }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleQuery(
  supabase: ReturnType<typeof createClient>,
  body: any,
  headers: Record<string, string>
) {
  const { noteId } = body;

  const { data: note } = await supabase
    .from("fiscal_notes")
    .select("access_key")
    .eq("id", noteId)
    .single();

  if (!note?.access_key) {
    return new Response(
      JSON.stringify({ error: "Nota sem chave de acesso para consulta" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const brasilRes = await fetch(`${BRASILNFE_BASE_URL}/ObterArquivoNotaFiscal`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ChaveNF: note.access_key,
      FileType: 2,
      TipoDocumentoFiscal: 1,
    }),
  });

  const result = await brasilRes.text();
  console.log("Query result status:", brasilRes.status);

  const updateData: Record<string, any> = {};

  if (brasilRes.ok && result && !result.startsWith("{")) {
    try {
      const pdfBytes = Uint8Array.from(atob(result), c => c.charCodeAt(0));
      const pdfPath = `nfe-pdfs/${note.access_key}.pdf`;
      await supabase.storage.from("designer-files").upload(pdfPath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
      const { data: { publicUrl } } = supabase.storage.from("designer-files").getPublicUrl(pdfPath);
      updateData.pdf_url = publicUrl;
      updateData.status = "authorized";
    } catch (e) {
      console.error("Error storing queried PDF:", e);
    }
  }

  if (Object.keys(updateData).length > 0) {
    await supabase.from("fiscal_notes").update(updateData).eq("id", noteId);
  }

  return new Response(
    JSON.stringify({ success: brasilRes.ok, updateData }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCancel(
  supabase: ReturnType<typeof createClient>,
  body: any,
  headers: Record<string, string>
) {
  const { noteId, justificativa } = body;

  const { data: note } = await supabase
    .from("fiscal_notes")
    .select("access_key")
    .eq("id", noteId)
    .single();

  if (!note?.access_key) {
    return new Response(
      JSON.stringify({ error: "Nota sem chave de acesso para cancelamento" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const brasilRes = await fetch(`${BRASILNFE_BASE_URL}/CancelarNotaFiscal`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      TipoAmbiente: 1,
      ChaveNF: note.access_key,
      Justificativa: justificativa || "Cancelamento solicitado pelo emissor",
    }),
  });

  const brasilResult = await brasilRes.json();
  console.log("Cancel result:", JSON.stringify(brasilResult));

  const isSuccess = brasilResult?.Status === true || brasilRes.ok;

  if (isSuccess) {
    await supabase.from("fiscal_notes").update({ status: "cancelled" }).eq("id", noteId);
  }

  return new Response(
    JSON.stringify({ success: isSuccess, brasilResult }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleList(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("fiscal_notes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("List error:", error);
    throw new Error(error.message);
  }

  return new Response(JSON.stringify({ notes: data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
