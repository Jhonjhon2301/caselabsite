import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import CategoryBar from "./CategoryBar";
import { Loader2 } from "lucide-react";

interface ProductGridProps {
  searchQuery: string;
}

export default function ProductGrid({ searchQuery }: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name").order("name"),
      ]);

      const catMap = new Map((cats ?? []).map((c: any) => [c.id, c.name]));
      setProducts(
        (prods ?? []).map((p: any) => ({
          ...p,
          category_name: p.category_id ? catMap.get(p.category_id) ?? "Outros" : "Outros",
        }))
      );
      setCategories(cats ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const categoryNames = useMemo(() => {
    const names = new Set(products.map((p) => p.category_name || "Outros"));
    return ["Todos", ...Array.from(names)];
  }, [products]);

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory !== "Todos") {
      result = result.filter((p) => p.category_name === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          (p.category_name ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, searchQuery, products]);

  return (
    <>
      <CategoryBar active={activeCategory} onChange={setActiveCategory} categories={categoryNames} />
      <section id="produtos" className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-black text-xl md:text-2xl text-foreground text-center mb-8">
            Tendências e Lançamentos
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Carregando produtos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg text-muted-foreground">Nenhum modelo encontrado.</p>
              <p className="text-sm text-muted-foreground mt-1">Tente buscar por outro termo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
