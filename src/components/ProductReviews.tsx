import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Star, Send, Camera, X } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  customer_name: string | null;
  photos: string[];
  created_at: string;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setReviews((data as any[]) ?? []);
        setLoading(false);
      });
  }, [productId]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const handleSubmit = async () => {
    if (!user) { toast.error("Faça login para avaliar"); return; }
    if (!customerName.trim()) { toast.error("Informe seu nome"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      user_id: user.id,
      rating,
      comment: comment.trim() || null,
      customer_name: customerName.trim(),
    } as any);
    if (error) { toast.error("Erro ao enviar avaliação"); }
    else {
      toast.success("Avaliação enviada! Será publicada após aprovação.");
      setShowForm(false);
      setComment("");
      setRating(5);
    }
    setSubmitting(false);
  };

  const renderStars = (count: number, size = "w-4 h-4") =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`${size} ${i < count ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
    ));

  return (
    <div className="border-t border-border pt-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-lg">Avaliações</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex">{renderStars(Math.round(avgRating))}</div>
            <span className="text-sm text-muted-foreground">
              {avgRating.toFixed(1)} ({reviews.length} avaliação{reviews.length !== 1 ? "ões" : ""})
            </span>
          </div>
        </div>
        {user && !showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs font-semibold text-primary hover:underline">
            Escrever avaliação
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-muted/50 rounded-xl p-4 mb-6 border border-border">
          <h3 className="text-sm font-bold mb-3">Sua avaliação</h3>
          <div className="flex gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onMouseEnter={() => setHoverRating(i + 1)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(i + 1)}
              >
                <Star className={`w-6 h-6 transition-colors ${
                  i < (hoverRating || rating) ? "fill-primary text-primary" : "text-muted-foreground/30"
                }`} />
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Seu nome"
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm mb-2"
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte como foi sua experiência..."
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm min-h-[80px] mb-3"
          />
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={submitting} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
              <Send className="w-3.5 h-3.5" /> {submitting ? "Enviando..." : "Enviar"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-xs font-medium border border-border">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando avaliações...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma avaliação ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {(r.customer_name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{r.customer_name || "Anônimo"}</p>
                  <div className="flex gap-0.5">{renderStars(r.rating, "w-3 h-3")}</div>
                </div>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
