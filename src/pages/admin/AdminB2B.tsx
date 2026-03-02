import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Check, X, Eye, FileText } from "lucide-react";

interface B2BCustomer {
  id: string;
  user_id: string;
  company_name: string;
  cnpj: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  pricing_tier: string;
  discount_percent: number;
  min_order_quantity: number;
  is_approved: boolean;
  notes: string | null;
  created_at: string;
}

interface B2BQuote {
  id: string;
  b2b_customer_id: string;
  items: any;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
}

export default function AdminB2B() {
  const [customers, setCustomers] = useState<B2BCustomer[]>([]);
  const [quotes, setQuotes] = useState<B2BQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"customers" | "quotes">("customers");

  const load = async () => {
    setLoading(true);
    const [c, q] = await Promise.all([
      supabase.from("b2b_customers").select("*").order("created_at", { ascending: false }),
      supabase.from("b2b_quotes").select("*").order("created_at", { ascending: false }),
    ]);
    setCustomers((c.data as B2BCustomer[]) || []);
    setQuotes((q.data as B2BQuote[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleApproval = async (id: string, approved: boolean) => {
    const { error } = await supabase.from("b2b_customers").update({ is_approved: !approved }).eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success(approved ? "Bloqueado" : "Aprovado"); load(); }
  };

  const updateQuoteStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "approved") updates.approved_at = new Date().toISOString();
    const { error } = await supabase.from("b2b_quotes").update(updates).eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success("Orçamento atualizado"); load(); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" /> Área B2B
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Clientes corporativos e orçamentos</p>
      </div>

      <div className="flex gap-1.5 bg-muted rounded-lg p-1 w-fit">
        <button onClick={() => setTab("customers")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "customers" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
          Clientes ({customers.length})
        </button>
        <button onClick={() => setTab("quotes")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "quotes" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
          Orçamentos ({quotes.length})
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Carregando...</p>
      ) : tab === "customers" ? (
        customers.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum cliente B2B cadastrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{c.company_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_approved ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30"}`}>
                        {c.is_approved ? "Aprovado" : "Pendente"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.cnpj && `CNPJ: ${c.cnpj} · `}
                      {c.contact_name} · {c.contact_email} · {c.contact_phone}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Desconto: {c.discount_percent}% · Pedido mín: {c.min_order_quantity} un · Tier: {c.pricing_tier}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleApproval(c.id, c.is_approved)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                      c.is_approved
                        ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30"
                    }`}
                  >
                    {c.is_approved ? "Bloquear" : "Aprovar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        quotes.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum orçamento B2B</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map(q => {
              const items = Array.isArray(q.items) ? q.items : [];
              return (
                <div key={q.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          q.status === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" :
                          q.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30" :
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                        }`}>
                          {q.status === "approved" ? "Aprovado" : q.status === "rejected" ? "Rejeitado" : "Pendente"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(q.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{items.length} item(ns)</p>
                      <p className="text-sm font-medium">
                        Total: R$ {Number(q.total).toFixed(2).replace(".", ",")}
                        {Number(q.discount) > 0 && <span className="text-emerald-600 ml-2">(-R$ {Number(q.discount).toFixed(2).replace(".", ",")})</span>}
                      </p>
                    </div>
                    {q.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => updateQuoteStatus(q.id, "approved")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30">
                          Aprovar
                        </button>
                        <button onClick={() => updateQuoteStatus(q.id, "rejected")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30">
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
