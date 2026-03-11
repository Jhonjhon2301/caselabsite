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

    // Fetch order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) throw new Error("Pedido não encontrado");

    // Check if NF-e already emitted for this order
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

    // Fetch order items
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", order_id);

    if (!items || items.length === 0) throw new Error("Pedido sem itens");

    // Update order payment status
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid", status: "confirmed" })
      .eq("id", order_id);

    const internalRef = `PEDIDO-${order_id.slice(0, 8).toUpperCase()}`;
    const cleanCpf = order.customer_cpf?.replace(/\D/g, "") || "";

    // Build Brasil NFe payload
    const nfePayload: Record<string, any> = {
      TipoAmbiente: "1", // Produção
      ModeloDocumento: 55, // NF-e
      NaturezaOperacao: "Venda de mercadoria",
      Finalidade: 1, // Normal
      ConsumidorFinal: true,
      IndicadorPresenca: 2, // Não presencial, Internet
      CalcularIBPT: true,
      IdentificadorInterno: internalRef,
      Cliente: {
        Nome: order.customer_name || "CONSUMIDOR FINAL",
        IndicadorInscricaoEstadual: 9, // Não contribuinte
      },
      Produtos: items.map((item: any, idx: number) => ({
        Codigo: item.product_id || `PROD-${idx + 1}`,
        Descricao: item.product_name,
        Quantidade: item.quantity,
        ValorUnitario: Number(item.unit_price),
        UnidadeComercial: "UN",
        UnidadeTributavel: "UN",
        CodigoNCM: "73239300",
        CFOP: "5102",
        ICMS: {
          SituacaoTributaria: "102",
          Origem: 0,
        },
        PIS: {
          SituacaoTributaria: "07",
        },
        COFINS: {
          SituacaoTributaria: "07",
        },
      })),
      Pagamentos: [
        {
          TipoPagamento: "01",
          ValorPagamento: Number(order.total),
        },
      ],
    };

    // Set CPF
    if (cleanCpf && cleanCpf.length === 11) {
      nfePayload.Cliente.CPF = cleanCpf;
    } else if (cleanCpf && cleanCpf.length === 14) {
      nfePayload.Cliente.CNPJ = cleanCpf;
    }

    // Send email to customer
    if (order.customer_email) {
      nfePayload.Cliente.Email = order.customer_email;
    }

    // Shipping address
    if (order.shipping_address) {
      nfePayload.Cliente.Endereco = {
        Logradouro: order.shipping_address,
        Numero: order.shipping_number || "S/N",
        Bairro: order.shipping_neighborhood || "",
        Municipio: order.shipping_city || "",
        UF: order.shipping_state || "",
        CEP: order.shipping_cep?.replace(/\D/g, "") || "",
      };
    }

    console.log("Emitting NF-e via Brasil NFe for order:", order_id);

    // Call Brasil NFe API
    const brasilRes = await fetch(`${BRASILNFE_BASE_URL}/EnviarNotaFiscal`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BRASILNFE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nfePayload),
    });

    const brasilResult = await brasilRes.json();
    console.log("Brasil NFe response:", JSON.stringify(brasilResult));

    const returnNF = brasilResult?.ReturnNF || {};
    const hasError = brasilResult?.Error || !brasilRes.ok;
    const isAuthorized = !hasError && (returnNF?.ChaveNFe || returnNF?.Numero);
    const status = isAuthorized ? "authorized" : (hasError ? "error" : "processing");
    const errorMessage = brasilResult?.Error || (!brasilRes.ok ? (returnNF?.Motivo || JSON.stringify(brasilResult)) : null);

    // Extract PDF and XML from Base64 response
    let pdfUrl: string | null = null;
    let xmlUrl: string | null = null;

    // If we get Base64File (PDF), store it
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

    // Save fiscal note record
    await supabaseAdmin.from("fiscal_notes").insert({
      order_id,
      type: "nfe",
      status,
      focus_ref: internalRef, // Reusing field for internal reference
      customer_name: order.customer_name,
      customer_cpf: order.customer_cpf,
      customer_email: order.customer_email,
      total: order.total,
      number: returnNF?.Numero?.toString() || null,
      series: returnNF?.Serie?.toString() || null,
      access_key: returnNF?.ChaveNFe || null,
      pdf_url: pdfUrl,
      items: items.map((i: any) => ({
        name: i.product_name,
        quantity: i.quantity,
        price: Number(i.unit_price),
      })),
      error_message: errorMessage,
      created_by: order.user_id,
    });

    return new Response(
      JSON.stringify({ success: brasilRes.ok, brasilResult: { status, number: returnNF?.Numero, access_key: returnNF?.ChaveNFe } }),
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
