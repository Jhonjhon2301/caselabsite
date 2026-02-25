import { supabase } from "@/integrations/supabase/client";

export async function generateQuotePdf(
  items: { name: string; quantity: number; price: number }[],
  customer?: { name?: string; email?: string; phone?: string; cpf?: string }
) {
  const { data, error } = await supabase.functions.invoke("generate-pdf", {
    body: { type: "quote", items, customer },
  });

  if (error) throw error;
  openHtmlInNewTab(data.html, `Orcamento-${data.quoteNumber}`);
}

export async function generateReceiptPdf(orderId: string) {
  const { data, error } = await supabase.functions.invoke("generate-pdf", {
    body: { type: "receipt", orderId },
  });

  if (error) throw error;
  openHtmlInNewTab(data.html, `Recibo-${orderId.slice(0, 8)}`);
}

function openHtmlInNewTab(html: string, title: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    // Fallback: download as HTML
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = title;
  // Auto-trigger print dialog so user can save as PDF
  printWindow.onload = () => printWindow.print();
}
