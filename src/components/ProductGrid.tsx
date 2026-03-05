import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import CategoryBar from "./CategoryBar";
import { Loader2 } from "lucide-react";

interface ProductGridProps {
  searchQuery: string;
  selectedModelId?: string | null;
}

export default function ProductGrid({ searchQuery, selectedModelId }: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; parent_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name, parent_id").order("name"),
      ]);

      const catMap = new Map((cats ?? []).map((c: any) => [c.id, c]));
      setProducts(
        (prods ?? []).map((p: any) => ({
          ...p,
          category_name: p.category_id ? catMap.get(p.category_id)?.name ?? "Outros" : "Outros",
          _category_parent_id: p.category_id ? catMap.get(p.category_id)?.parent_id ?? null : null,
          _category_id: p.category_id,
        }))
      );
      setCategories(cats ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Reset active category when model changes
  useEffect(() => {
    setActiveCategory("Todos");
  }, [selectedModelId]);

  // Get subcategories for the selected model
  const subcategoryIds = useMemo(() => {
    if (!selectedModelId) return null;
    return new Set(categories.filter((c) => c.parent_id === selectedModelId).map((c) => c.id));
  }, [selectedModelId, categories]);

  // Get category names for the bar (subcategories of selected model, or all top-level if no model)
  const categoryNames = useMemo(() => {
    if (selectedModelId) {
      const subs = categories.filter((c) => c.parent_id === selectedModelId);
      if (subs.length > 0) return ["Todos", ...subs.map((c) => c.name)];
      // If no subcategories, this model IS a leaf category — show "Todos" only
      return ["Todos"];
    }
    // No model selected: show all unique category names from products
    const names = new Set(products.map((p) => p.category_name || "Outros"));
    return ["Todos", ...Array.from(names)];
  }, [selectedModelId, categories, products]);

  const filtered = useMemo(() => {
    let result = products;

    // Filter by model
    if (selectedModelId) {
      if (subcategoryIds && subcategoryIds.size > 0) {
        // Model has subcategories — show products in those subcategories
        result = result.filter((p: any) => subcategoryIds.has(p._category_id));
      } else {
        // Model IS a leaf category — show products directly in this category
        result = result.filter((p: any) => p._category_id === selectedModelId);
      }
    }

    // Filter by subcategory
    if (activeCategory !== "Todos") {
      result = result.filter((p) => p.category_name === activeCategory);
    }

    // Search
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
  }, [activeCategory, searchQuery, products, selectedModelId, subcategoryIds]);

  const showCategoryBar = categoryNames.length > 1;

  return (
    <>
      {showCategoryBar && (
        <CategoryBar active={activeCategory} onChange={setActiveCategory} categories={categoryNames} />
      )}
      <section id="produtos" className="py-6 sm:py-8 md:py-12 bg-background">
        <div className="container mx-auto px-3 sm:px-4">
          <h2 className="font-heading font-black text-lg sm:text-xl md:text-2xl text-foreground text-center mb-6 sm:mb-8">
            {selectedModelId
              ? categories.find((c) => c.id === selectedModelId)?.name ?? "Produtos"
              : "Tendências e Lançamentos"}
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
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
