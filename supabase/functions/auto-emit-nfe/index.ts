import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_id é obrigatório");

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) throw new Error("Pedido não encontrado");

    const { data: existing } = await supabaseAdmin
      .from("fiscal_notes")
      .select("id")
      .eq("order_id", order_id)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ success: true, message: "NF-e já emitida para este pedido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("*, products(ncm, cfop, cest, ean, unidade_comercial, origem_produto, cod_situacao_tributaria_icms, cod_situacao_tributaria_pis, cod_situacao_tributaria_cofins, fiscal_product_code)")
      .eq("order_id", order_id);

    if (!items || items.length === 0) throw new Error("Pedido sem itens");

    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid", status: "confirmed" })
      .eq("id", order_id);

    // Fetch profile data
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", order.user_id)
      .maybeSingle();

    // Detect CPF vs CNPJ
    const cleanCpf = order.customer_cpf?.replace(/\D/g, "") || "";
    const isCnpj = cleanCpf.length > 11;

    // Fetch B2B data if CNPJ
    let b2bData: any = null;
    if (isCnpj) {
      const { data } = await supabaseAdmin
        .from("b2b_customers")
        .select("*")
        .eq("user_id", order.user_id)
        .maybeSingle();
      b2bData = data;
    }

    const internalRef = `PEDIDO-${order_id.slice(0, 8).toUpperCase()}`;

    // Build Cliente object with full data
    const cliente: Record<string, any> = {
      NmCliente: isCnpj
        ? (b2bData?.company_name || order.customer_name || "CONSUMIDOR FINAL")
        : (order.customer_name || profile?.full_name || "CONSUMIDOR FINAL"),
      IndicadorIe: isCnpj ? (b2bData?.indicador_ie ?? 1) : 9,
    };

    if (cleanCpf) {
      cliente.CpfCnpj = cleanCpf;
    }

    // IE for CNPJ
    if (isCnpj && b2bData?.state_registration) {
      cliente.Ie = b2bData.state_registration;
    }

    // ConsumidorFinal
    const consumidorFinal = !isCnpj;

    // Build address from order shipping or B2B/profile fallback
    const addr = {
      logradouro: order.shipping_address || (isCnpj ? b2bData?.address_street : profile?.address_street) || "",
      numero: order.shipping_number || (isCnpj ? b2bData?.address_number : profile?.address_number) || "S/N",
      bairro: order.shipping_neighborhood || (isCnpj ? b2bData?.address_neighborhood : profile?.address_neighborhood) || "",
      municipio: order.shipping_city || (isCnpj ? b2bData?.address_city : profile?.address_city) || "",
      uf: order.shipping_state || (isCnpj ? b2bData?.address_state : profile?.address_state) || "",
      cep: (order.shipping_cep || (isCnpj ? b2bData?.address_cep : profile?.address_cep) || "").replace(/\D/g, ""),
      complemento: order.shipping_complement || (isCnpj ? b2bData?.address_complement : profile?.address_complement) || "",
    };

    if (addr.logradouro) {
      cliente.Endereco = {
        Logradouro: addr.logradouro,
        Numero: addr.numero,
        Bairro: addr.bairro,
        Municipio: addr.municipio,
        Uf: addr.uf,
        Cep: addr.cep,
        ...(addr.complemento && { Complemento: addr.complemento }),
        CodPais: 1058,
        Pais: "BRASIL",
      };
    }

    // Contact
    const contactEmail = order.customer_email || (isCnpj ? b2bData?.contact_email : profile?.email) || "";
    const contactPhone = (isCnpj ? b2bData?.contact_phone : profile?.phone)?.replace(/\D/g, "") || "";

    if (contactEmail || contactPhone) {
      cliente.Contato = {
        ...(contactEmail && { Email: contactEmail }),
        ...(contactPhone && { Telefone: contactPhone }),
      };
    }

    // Build payload following official Brasil NFe API docs
    const nfePayload: Record<string, any> = {
      TipoAmbiente: "1",
      ModeloDocumento: 55,
      NaturezaOperacao: "Venda de mercadoria",
      Finalidade: 1,
      ConsumidorFinal: consumidorFinal,
      IndicadorPresenca: 2,
      CalcularIBPT: true,
      IdentificadorInterno: internalRef,
      Cliente: cliente,
      Produtos: items.map((item: any, idx: number) => ({
        CodProdutoServico: item.products?.fiscal_product_code || String(idx + 1).padStart(4, "0"),
        NmProduto: item.product_name,
        Quantidade: item.quantity,
        ValorUnitario: Number(item.unit_price),
        ValorTotal: Number(item.unit_price) * item.quantity,
        UnidadeComercial: item.products?.unidade_comercial || "UND",
        UnidadeComercialTributavel: item.products?.unidade_comercial || "UND",
        NCM: item.products?.ncm || "00000000",
        CFOP: Number(item.products?.cfop) || 5102,
        OrigemProduto: Number(item.products?.origem_produto) || 0,
        ...(item.products?.ean && { EAN: item.products.ean }),
        ...(item.products?.cest && { CEST: item.products.cest }),
        Imposto: {
          ICMS: { CodSituacaoTributaria: item.products?.cod_situacao_tributaria_icms || "102" },
          PIS: { CodSituacaoTributaria: item.products?.cod_situacao_tributaria_pis || "07" },
          COFINS: { CodSituacaoTributaria: item.products?.cod_situacao_tributaria_cofins || "07" },
        },
      })),
      Pagamentos: [
        {
          FormaPagamento: "17",
          VlPago: Number(order.total),
        },
      ],
      Transporte: {
        ModalidadeFrete: 9,
      },
    };

    console.log("Emitting NF-e via Brasil NFe for order:", order_id);
    console.log("Payload:", JSON.stringify(nfePayload));

    const brasilRes = await fetch(`${BRASILNFE_BASE_URL}/EnviarNotaFiscal`, {
      method: "POST",
      headers: {
        Token: BRASILNFE_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nfePayload),
    });

    const brasilResult = await brasilRes.json();
    console.log("Brasil NFe response:", JSON.stringify(brasilResult));

    const returnNF = brasilResult?.ReturnNF || {};
    const hasError = brasilResult?.Error || !brasilRes.ok;
    const isAuthorized = !hasError && returnNF?.Ok === true;
    const status = isAuthorized ? "authorized" : (hasError ? "error" : "processing");
    const errorMessage = brasilResult?.Error || (!brasilRes.ok ? (returnNF?.DsStatusRespostaSefaz || JSON.stringify(brasilResult)) : null);

    let pdfUrl: string | null = null;
    if (brasilResult?.Base64File) {
      try {
        const pdfBytes = Uint8Array.from(atob(brasilResult.Base64File), c => c.charCodeAt(0));
        const pdfPath = `nfe-pdfs/${order_id}.pdf`;
        await supabaseAdmin.storage.from("designer-files").upload(pdfPath, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });
        const { data: { publicUrl } } = supabaseAdmin.storage.from("designer-files").getPublicUrl(pdfPath);
        pdfUrl = publicUrl;
      } catch (e) {
        console.error("Error storing PDF:", e);
      }
    }

    let xmlUrl: string | null = null;
    if (brasilResult?.Base64Xml) {
      try {
        const xmlBytes = Uint8Array.from(atob(brasilResult.Base64Xml), c => c.charCodeAt(0));
        const xmlPath = `nfe-xmls/${order_id}.xml`;
        await supabaseAdmin.storage.from("designer-files").upload(xmlPath, xmlBytes, {
          contentType: "application/xml",
          upsert: true,
        });
        const { data: { publicUrl } } = supabaseAdmin.storage.from("designer-files").getPublicUrl(xmlPath);
        xmlUrl = publicUrl;
      } catch (e) {
        console.error("Error storing XML:", e);
      }
    }

    await supabaseAdmin.from("fiscal_notes").insert({
      order_id,
      type: "nfe",
      status,
      focus_ref: internalRef,
      customer_name: cliente.NmCliente,
      customer_cpf: cleanCpf || null,
      customer_email: contactEmail || null,
      total: order.total,
      number: returnNF?.Numero?.toString() || null,
      series: returnNF?.Serie?.toString() || null,
      access_key: returnNF?.ChaveNF || null,
      pdf_url: pdfUrl,
      xml_url: xmlUrl,
      items: items.map((i: any) => ({
        name: i.product_name,
        quantity: i.quantity,
        price: Number(i.unit_price),
      })),
      error_message: errorMessage,
      created_by: order.user_id,
    });

    return new Response(
      JSON.stringify({ success: brasilRes.ok && isAuthorized, brasilResult: { status, number: returnNF?.Numero, access_key: returnNF?.ChaveNF } }),
      { status: brasilRes.ok ? 200 : 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Auto emit NF-e error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
