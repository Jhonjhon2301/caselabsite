import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Check, X, MessageSquare } from "lucide-react";

export default function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");

  const fetchReviews = async () => {
    setLoading(true);
    let query = supabase.from("product_reviews").select("*, products(name)").order("created_at", { ascending: false });
    if (filter === "pending") query = query.eq("is_approved", false);
    else if (filter === "approved") query = query.eq("is_approved", true);
    const { data } = await query;
    setReviews((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [filter]);

  const approve = async (id: string) => {
    await supabase.from("product_reviews").update({ is_approved: true } as any).eq("id", id);
    toast.success("Avaliação aprovada!");
    fetchReviews();
  };

  const reject = async (id: string) => {
    await supabase.from("product_reviews").delete().eq("id", id);
    toast.success("Avaliação removida!");
    fetchReviews();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Avaliações</h1>
          <p className="text-xs text-muted-foreground">{reviews.length} avaliação(ões)</p>
        </div>
        <div className="flex gap-1.5 bg-muted rounded-lg p-1">
          {([["pending", "Pendentes"], ["approved", "Aprovadas"], ["all", "Todas"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma avaliação {filter === "pending" ? "pendente" : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {(r.customer_name || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold">{r.customer_name || "Anônimo"}</p>
                    <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ml-auto ${r.is_approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {r.is_approved ? "Aprovada" : "Pendente"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Produto: {r.products?.name || "—"}</p>
                  <div className="flex gap-0.5 mb-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  {r.comment && <p className="text-sm text-foreground">{r.comment}</p>}
                </div>
                {!r.is_approved && (
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => approve(r.id)} className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200" title="Aprovar">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => reject(r.id)} className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200" title="Rejeitar">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
