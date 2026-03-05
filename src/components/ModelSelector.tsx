import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight } from "lucide-react";

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
    <section className="py-6 sm:py-8 md:py-10 bg-background">
      <div className="container mx-auto px-3 sm:px-4">
        <h2 className="font-heading font-black text-base sm:text-lg md:text-xl text-foreground text-center mb-1">
          Escolha seu modelo
        </h2>
        <p className="text-[11px] sm:text-xs text-muted-foreground text-center mb-5 sm:mb-6">
          Selecione o modelo da garrafa para ver as opções
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
          {models.map((model) => {
            const isActive = selectedModelId === model.id;
            return (
              <button
                key={model.id}
                onClick={() => onSelectModel(isActive ? null : model.id)}
                className={`relative flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 group ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? "bg-primary/10" : "bg-secondary"
                }`}>
                  {model.icon ? (
                    <span className="text-2xl sm:text-3xl">{model.icon}</span>
                  ) : (
                    <span className="text-lg sm:text-xl font-black text-muted-foreground">{model.name.charAt(0)}</span>
                  )}
                </div>
                <span className={`text-[11px] sm:text-xs font-bold text-center leading-tight transition-colors ${
                  isActive ? "text-primary" : "text-foreground"
                }`}>
                  {model.name}
                </span>
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-primary-foreground" />
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
