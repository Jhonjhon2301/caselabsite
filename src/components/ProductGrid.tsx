import { products } from "@/data/products";
import ProductCard from "./ProductCard";
import CategoryBar from "./CategoryBar";
import { useState, useMemo } from "react";

interface ProductGridProps {
  searchQuery: string;
}

export default function ProductGrid({ searchQuery }: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState("Todos");

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory !== "Todos") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, searchQuery]);

  return (
    <>
      <CategoryBar active={activeCategory} onChange={setActiveCategory} />
      <section id="produtos" className="py-10 md:py-16">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-heading font-black text-3xl md:text-4xl text-foreground">Nossos Trabalhos</h2>
            <p className="text-sm text-muted-foreground mt-1">Inspire-se e escolha o modelo perfeito — ou crie o seu!</p>
          </div>

          {filtered.length === 0 ? (
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
