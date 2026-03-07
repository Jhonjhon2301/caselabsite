import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
}

interface ModelSelectorProps {
  selectedModelId: string | null;
  onSelectModel: (id: string | null) => void;
}

export default function ModelSelector({ selectedModelId, onSelectModel }: ModelSelectorProps) {
  const [models, setModels] = useState<Category[]>([]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, icon, parent_id")
      .is("parent_id", null)
      .order("name")
      .then(({ data }) => {
        if (data) setModels(data);
      });
  }, []);

  if (models.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 bg-background">
      <div className="container mx-auto px-4">
        {/* Minimal header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="h-px flex-1 bg-border" />
          <h2 className="font-heading font-black text-xs sm:text-sm uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
            Nossas Linhas
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Models */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
          {models.map((model) => {
            const isActive = selectedModelId === model.id;
            return (
              <button
                key={model.id}
                onClick={() => onSelectModel(isActive ? null : model.id)}
                className={`relative group flex items-center gap-3 sm:gap-4 px-5 sm:px-7 py-3.5 sm:py-4 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-foreground text-background shadow-xl shadow-foreground/20"
                    : "bg-card border border-border hover:border-foreground/30 hover:shadow-lg text-foreground"
                }`}
              >
                {/* Icon */}
                {model.icon && (
                  <span className={`text-xl sm:text-2xl transition-transform duration-300 ${
                    isActive ? "scale-110" : "group-hover:scale-105"
                  }`}>
                    {model.icon}
                  </span>
                )}

                {/* Name */}
                <span className={`text-xs sm:text-sm font-bold tracking-wide whitespace-nowrap ${
                  isActive ? "text-background" : ""
                }`}>
                  {model.name}
                </span>

                {/* Check mark */}
                {isActive && (
                  <div className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center ml-1 animate-in zoom-in duration-200">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
