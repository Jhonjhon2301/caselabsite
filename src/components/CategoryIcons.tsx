import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export default function CategoryIcons({ onSelectCategory }: { onSelectCategory?: (name: string) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, icon")
      .order("name")
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 md:py-10 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 md:gap-6 justify-items-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory?.(cat.name)}
              className="flex flex-col items-center gap-1.5 sm:gap-2 group w-full"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] rounded-full bg-secondary border-2 border-border group-hover:border-primary group-hover:shadow-md transition-all duration-200 flex items-center justify-center overflow-hidden">
                {cat.icon ? (
                  <span className="text-xl sm:text-2xl">{cat.icon}</span>
                ) : (
                  <span className="text-lg sm:text-xl font-bold text-muted-foreground">{cat.name.charAt(0)}</span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
