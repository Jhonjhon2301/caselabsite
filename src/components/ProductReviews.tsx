import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Star, Send, ThumbsUp } from "lucide-react";
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

  // Rating breakdown
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent: reviews.length > 0
      ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
      : 0,
  }));

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
    <div>
      {/* Header — Gocase style */}
      <h2 className="font-heading font-bold text-lg md:text-xl text-center mb-8">Opinião dos consumidores</h2>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center">Carregando avaliações...</p>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">Nenhuma avaliação ainda. Seja o primeiro!</p>
          {user && !showForm && (
            <button onClick={() => setShowForm(true)} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-bold">
              Escrever avaliação
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Rating summary row */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            {/* Big number */}
            <div className="text-center shrink-0">
              <div className="flex items-center gap-2 justify-center">
                <span className="text-4xl font-black text-foreground">{avgRating.toFixed(1)}</span>
                <div className="flex">{renderStars(Math.round(avgRating), "w-5 h-5")}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Baseado em {reviews.length} Avaliação{reviews.length !== 1 ? "ões" : ""}
              </p>
            </div>

            {/* Breakdown bars */}
            <div className="flex-1 w-full max-w-xs space-y-1.5">
              {ratingCounts.map(({ star, count, percent }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-5 text-right text-muted-foreground font-medium">{star} ★</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-8 text-right font-medium">{count}</span>
                </div>
              ))}
            </div>

            {/* Write review button */}
            {user && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-xs font-bold shrink-0"
              >
                Escrever avaliação
              </button>
            )}
          </div>

          {/* Review form */}
          {showForm && (
            <div className="bg-muted/50 rounded-xl p-4 mb-6 border border-border max-w-2xl mx-auto">
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

          {/* Individual reviews — Gocase style */}
          <div className="divide-y divide-border max-w-3xl mx-auto">
            {reviews.map((r) => (
              <div key={r.id} className="py-6 flex gap-6">
                {/* Left — rating */}
                <div className="hidden sm:flex flex-col items-center shrink-0 w-16">
                  <span className="text-xl font-bold text-foreground">{r.rating.toFixed(1)}</span>
                  <div className="flex gap-0.5">{renderStars(r.rating, "w-3 h-3")}</div>
                </div>

                {/* Right — content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{r.customer_name || "Anônimo"}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Comprador verificado</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  {/* Mobile stars */}
                  <div className="flex sm:hidden gap-0.5 mb-2">{renderStars(r.rating, "w-3.5 h-3.5")}</div>

                  {r.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">{r.comment}</p>
                  )}

                  {/* Photos */}
                  {r.photos && r.photos.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {r.photos.map((photo, i) => (
                        <img key={i} src={photo} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                      ))}
                    </div>
                  )}

                  <button className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2 hover:text-foreground transition-colors">
                    <ThumbsUp className="w-3 h-3" /> Este comentário foi útil?
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
