import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import CategoryBar from "./CategoryBar";

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
      <CategoryBar
        active={activeCategory}
        onChange={setActiveCategory}
        categories={categoryNames}
      />
      <section id="produtos" className="py-10 md:py-16">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-heading font-black text-3xl md:text-4xl text-foreground">Nossos Trabalhos</h2>
            <p className="text-sm text-muted-foreground mt-1">Inspire-se e escolha o modelo perfeito — ou crie o seu!</p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Carregando produtos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Nenhum modelo encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
