import { products } from "@/data/products";
import ProductCard from "./ProductCard";
import { useState } from "react";

export default function ProductGrid() {
  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category)))];
  const [activeCategory, setActiveCategory] = useState("Todos");

  const filtered = activeCategory === "Todos" ? products : products.filter((p) => p.category === activeCategory);

  return (
    <section id="produtos" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-6xl font-heading text-center mb-2">NOSSOS TRABALHOS</h2>
        <p className="text-center text-muted-foreground mb-10">Inspire-se e escolha o modelo perfeito para você</p>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "gradient-brand text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
