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
    <section className="py-8 bg-background">
      <div className="container mx-auto">
        <div className="flex gap-6 overflow-x-auto scrollbar-none justify-center flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory?.(cat.name)}
              className="flex flex-col items-center gap-2 group shrink-0 min-w-[72px]"
            >
              <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full bg-secondary border-2 border-border group-hover:border-primary group-hover:shadow-md transition-all duration-200 flex items-center justify-center overflow-hidden">
                {cat.icon ? (
                  <span className="text-2xl">{cat.icon}</span>
                ) : (
                  <span className="text-xl font-bold text-muted-foreground">{cat.name.charAt(0)}</span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight max-w-[80px]">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
