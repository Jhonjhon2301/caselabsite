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
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: roleData } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").limit(1);
  if (!roleData || roleData.length === 0) {
    return new Response(JSON.stringify({ error: "Acesso negado" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const headers = { Token: BRASILNFE_TOKEN, "Content-Type": "application/json" };

  try {
    const body = await req.json();
    const { action } = body;
    console.log("Action:", action);

    if (action === "emit") return await handleEmit(supabaseAdmin, body, headers, user.id);
    if (action === "query") return await handleQuery(supabaseAdmin, body, headers);
    if (action === "cancel") return await handleCancel(supabaseAdmin, body, headers);
    if (action === "list") return await handleList(supabaseAdmin);

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Brasil NFe error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── EMIT ───
async function handleEmit(supabase: any, body: any, headers: Record<string, string>, userId: string) {
  const {
    modeloDocumento, naturezaOperacao, finalidade, tipoAmbiente,
    consumidorFinal, cpfCnpj, nomeCliente, indicadorIe, inscricaoEstadual,
    cep, logradouro, numero, bairro, municipio, uf, complemento, codMunicipio,
    telefone, email,
    items, total,
    modalidadeFrete, veiculo,
    indicadorPresenca, dataEmissao, horaEmissao, dataSaida, horaSaida,
    observacao, observacaoFisco,
    formaPagamento, valorPago, valorTroco,
    faturaNumero, faturaValor, faturaDesconto, faturaValorLiquido, parcelas,
    nfReferencia, ufSaidaPais, localDespacho, localEmbarque,
    orderId,
  } = body;

  const cleanDoc = cpfCnpj?.replace(/\D/g, "") || "";
  const internalRef = `NF-${Date.now().toString(36).toUpperCase()}`;

  // Build datetime strings
  let dataEmissaoISO: string | undefined;
  if (dataEmissao) {
    const time = horaEmissao || "00:00";
    dataEmissaoISO = `${dataEmissao}T${time}:00-03:00`;
  }
  let dataSaidaISO: string | undefined;
  if (dataSaida) {
    const time = horaSaida || "00:00";
    dataSaidaISO = `${dataSaida}T${time}:00-03:00`;
  }

  const nfePayload: Record<string, any> = {
    TipoAmbiente: tipoAmbiente || "1",
    ModeloDocumento: modeloDocumento || 55,
    NaturezaOperacao: naturezaOperacao || "Venda de mercadoria",
    Finalidade: finalidade || 1,
    ConsumidorFinal: consumidorFinal !== false,
    IndicadorPresenca: indicadorPresenca ?? 9,
    CalcularIBPT: true,
    IdentificadorInterno: internalRef,
  };

  if (dataEmissaoISO) nfePayload.DataEmissao = dataEmissaoISO;
  if (dataSaidaISO) nfePayload.DataEntradaSaida = dataSaidaISO;
  if (observacao) nfePayload.Observacao = observacao;
  if (observacaoFisco) nfePayload.ObservacaoFisco = observacaoFisco;
  if (nfReferencia) nfePayload.NFReferencia = [nfReferencia];

  // Cliente
  const cliente: Record<string, any> = {
    NmCliente: nomeCliente || "CONSUMIDOR FINAL",
    IndicadorIe: indicadorIe ?? 9,
  };
  if (cleanDoc) cliente.CpfCnpj = cleanDoc;
  if (inscricaoEstadual) cliente.Ie = inscricaoEstadual;

  // Endereço
  if (logradouro || cep) {
    cliente.Endereco = {
      ...(cep && { Cep: cep.replace(/\D/g, "") }),
      ...(logradouro && { Logradouro: logradouro }),
      ...(numero && { Numero: numero }),
      ...(bairro && { Bairro: bairro }),
      ...(municipio && { Municipio: municipio }),
      ...(uf && { Uf: uf }),
      ...(complemento && { Complemento: complemento }),
      ...(codMunicipio && { CodMunicipio: codMunicipio }),
      CodPais: 1058,
      Pais: "BRASIL",
    };
  }

  // Contato
  if (telefone || email) {
    cliente.Contato = {
      ...(telefone && { Telefone: telefone.replace(/\D/g, "") }),
      ...(email && { Email: email }),
    };
  }

  nfePayload.Cliente = cliente;

  // Produtos
  nfePayload.Produtos = (items || []).map((item: any, idx: number) => {
    const prod: Record<string, any> = {
      CodProdutoServico: item.code || String(idx + 1).padStart(4, "0"),
      NmProduto: item.name,
      Quantidade: Number(item.quantity),
      ValorUnitario: Number(item.price),
      ValorTotal: Number(item.price) * Number(item.quantity),
      UnidadeComercial: item.unidade || "UND",
      UnidadeComercialTributavel: item.unidade || "UND",
      NCM: item.ncm || "00000000",
      CFOP: Number(item.cfop) || 5102,
      OrigemProduto: Number(item.origem) || 0,
      Imposto: {
        ICMS: { CodSituacaoTributaria: item.cstIcms || "102" },
        PIS: { CodSituacaoTributaria: item.cstPis || "07" },
        COFINS: { CodSituacaoTributaria: item.cstCofins || "07" },
      },
    };
    if (item.discount && Number(item.discount) > 0) {
      prod.ValorDesconto = Number(item.discount);
    }
    if (item.ean) prod.EAN = item.ean;
    if (item.cest) prod.CEST = item.cest;
    return prod;
  });

  // Pagamentos
  nfePayload.Pagamentos = [{
    FormaPagamento: formaPagamento || "17",
    VlPago: Number(valorPago) || Number(total),
    ...(Number(valorTroco) > 0 && { VlTroco: Number(valorTroco) }),
  }];

  // Transporte
  if (modalidadeFrete !== undefined) {
    const transporte: Record<string, any> = { ModalidadeFrete: Number(modalidadeFrete) };
    if (veiculo?.placa) {
      transporte.Veiculo = {
        Placa: veiculo.placa,
        ...(veiculo.uf && { UF: veiculo.uf }),
        ...(veiculo.rntc && { RNTC: veiculo.rntc }),
      };
    }
    nfePayload.Transporte = transporte;
  }

  // Cobrança
  if (faturaNumero || (parcelas && parcelas.length > 0)) {
    const cobranca: Record<string, any> = {};
    if (faturaNumero) {
      cobranca.Fatura = {
        Numero: faturaNumero,
        Valor: Number(faturaValor) || 0,
        Desconto: Number(faturaDesconto) || 0,
        ValorLiquido: Number(faturaValorLiquido) || 0,
      };
    }
    if (parcelas && parcelas.length > 0) {
      cobranca.Parcelas = parcelas.filter((p: any) => p.vencimento).map((p: any) => ({
        Vencimento: `${p.vencimento}T00:00:00-03:00`,
        Valor: Number(p.valor) || 0,
      }));
    }
    nfePayload.Cobranca = cobranca;
  }

  // Exportação
  if (ufSaidaPais || localDespacho || localEmbarque) {
    nfePayload.Exporta = {
      ...(ufSaidaPais && { UFSaidaPais: ufSaidaPais }),
      ...(localDespacho && { LocalDespacho: localDespacho }),
      ...(localEmbarque && { LocalEmbarqueTransp: localEmbarque }),
    };
  }

  console.log("Emitting NF-e via Brasil NFe, ref:", internalRef);
  console.log("Payload:", JSON.stringify(nfePayload));

  const brasilRes = await fetch(`${BRASILNFE_BASE_URL}/EnviarNotaFiscal`, {
    method: "POST", headers, body: JSON.stringify(nfePayload),
  });

  const brasilResult = await brasilRes.json();
  console.log("Brasil NFe response:", JSON.stringify(brasilResult));

  const returnNF = brasilResult?.ReturnNF || {};
  const hasError = brasilResult?.Error || !brasilRes.ok;
  const isAuthorized = !hasError && returnNF?.Ok === true;
  const status = isAuthorized ? "authorized" : (hasError ? "error" : "processing");
  const errorMessage = brasilResult?.Error || (!brasilRes.ok ? (returnNF?.DsStatusRespostaSefaz || JSON.stringify(brasilResult)) : null);

  // Store PDF
  let pdfUrl: string | null = null;
  if (brasilResult?.Base64File) {
    try {
      const pdfBytes = Uint8Array.from(atob(brasilResult.Base64File), c => c.charCodeAt(0));
      const pdfPath = `nfe-pdfs/${internalRef}.pdf`;
      await supabase.storage.from("designer-files").upload(pdfPath, pdfBytes, { contentType: "application/pdf", upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("designer-files").getPublicUrl(pdfPath);
      pdfUrl = publicUrl;
    } catch (e) { console.error("Error storing PDF:", e); }
  }

  // Store XML
  let xmlUrl: string | null = null;
  if (brasilResult?.Base64Xml) {
    try {
      const xmlBytes = Uint8Array.from(atob(brasilResult.Base64Xml), c => c.charCodeAt(0));
      const xmlPath = `nfe-xmls/${internalRef}.xml`;
      await supabase.storage.from("designer-files").upload(xmlPath, xmlBytes, { contentType: "application/xml", upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("designer-files").getPublicUrl(xmlPath);
      xmlUrl = publicUrl;
    } catch (e) { console.error("Error storing XML:", e); }
  }

  const { data: savedNote, error: dbError } = await supabase
    .from("fiscal_notes")
    .insert({
      order_id: orderId || null,
      type: (modeloDocumento || 55) === 65 ? "nfce" : "nfe",
      status,
      focus_ref: internalRef,
      customer_name: nomeCliente || "CONSUMIDOR FINAL",
      customer_cpf: cleanDoc || null,
      customer_email: email || null,
      total: Number(total) || 0,
      number: returnNF?.Numero?.toString() || null,
      series: returnNF?.Serie?.toString() || null,
      access_key: returnNF?.ChaveNF || null,
      pdf_url: pdfUrl,
      xml_url: xmlUrl,
      items: items || [],
      notes: observacao || null,
      error_message: errorMessage,
      created_by: userId,
    })
    .select().single();

  if (dbError) {
    console.error("DB save error:", dbError);
    throw new Error(`Erro ao salvar nota: ${dbError.message}`);
  }

  return new Response(
    JSON.stringify({ success: brasilRes.ok && isAuthorized, note: savedNote, brasilResult: { status, error: errorMessage }, error: errorMessage }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── QUERY ───
async function handleQuery(supabase: any, body: any, headers: Record<string, string>) {
  const { noteId } = body;
  const { data: note } = await supabase.from("fiscal_notes").select("access_key").eq("id", noteId).single();

  if (!note?.access_key) {
    return new Response(JSON.stringify({ error: "Nota sem chave de acesso para consulta" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const brasilRes = await fetch(`${BRASILNFE_BASE_URL}/ObterArquivoNotaFiscal`, {
    method: "POST", headers,
    body: JSON.stringify({ ChaveNF: note.access_key, FileType: 2, TipoDocumentoFiscal: 1 }),
  });

  const result = await brasilRes.text();
  const updateData: Record<string, any> = {};

  if (brasilRes.ok && result && !result.startsWith("{")) {
    try {
      const pdfBytes = Uint8Array.from(atob(result), c => c.charCodeAt(0));
      const pdfPath = `nfe-pdfs/${note.access_key}.pdf`;
      await supabase.storage.from("designer-files").upload(pdfPath, pdfBytes, { contentType: "application/pdf", upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("designer-files").getPublicUrl(pdfPath);
      updateData.pdf_url = publicUrl;
      updateData.status = "authorized";
    } catch (e) { console.error("Error storing queried PDF:", e); }
  }

  if (Object.keys(updateData).length > 0) {
    await supabase.from("fiscal_notes").update(updateData).eq("id", noteId);
  }

  return new Response(JSON.stringify({ success: brasilRes.ok, updateData }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── CANCEL ───
async function handleCancel(supabase: any, body: any, headers: Record<string, string>) {
  const { noteId, justificativa } = body;
  const { data: note } = await supabase.from("fiscal_notes").select("access_key").eq("id", noteId).single();

  if (!note?.access_key) {
    return new Response(JSON.stringify({ error: "Nota sem chave de acesso para cancelamento" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const brasilRes = await fetch(`${BRASILNFE_BASE_URL}/CancelarNotaFiscal`, {
    method: "POST", headers,
    body: JSON.stringify({
      TipoAmbiente: 1,
      ChaveNF: note.access_key,
      Justificativa: justificativa || "Cancelamento solicitado pelo emissor",
    }),
  });

  const brasilResult = await brasilRes.json();
  const isSuccess = brasilResult?.Status === true || brasilRes.ok;

  if (isSuccess) {
    await supabase.from("fiscal_notes").update({ status: "cancelled" }).eq("id", noteId);
  }

  return new Response(JSON.stringify({ success: isSuccess, brasilResult }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── LIST ───
async function handleList(supabase: any) {
  const { data, error } = await supabase.from("fiscal_notes").select("*").order("created_at", { ascending: false }).limit(100);

  if (error) throw new Error(error.message);

  return new Response(JSON.stringify({ notes: data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
