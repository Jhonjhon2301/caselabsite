import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, Sparkles } from "lucide-react";

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
    <section className="py-10 sm:py-14 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/20" />
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3 h-3" />
            Catálogo
          </div>
          <h2 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-foreground mb-2">
            Escolha seu modelo
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Selecione a linha de produtos para explorar as opções disponíveis
          </p>
        </div>

        {/* Models Grid */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
          {models.map((model) => {
            const isActive = selectedModelId === model.id;
            return (
              <button
                key={model.id}
                onClick={() => onSelectModel(isActive ? null : model.id)}
                className={`relative flex flex-col items-center gap-3 px-6 py-5 sm:px-8 sm:py-6 rounded-2xl border-2 transition-all duration-300 group min-w-[140px] sm:min-w-[180px] ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]"
                    : "border-transparent bg-card shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
                }`}
              >
                {/* Icon */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "bg-primary/15 shadow-inner"
                    : "bg-secondary group-hover:bg-primary/10"
                }`}>
                  {model.icon ? (
                    <span className="text-3xl sm:text-4xl drop-shadow-sm">{model.icon}</span>
                  ) : (
                    <span className="text-xl sm:text-2xl font-black text-muted-foreground">{model.name.charAt(0)}</span>
                  )}
                </div>

                {/* Name */}
                <span className={`text-xs sm:text-sm font-bold text-center leading-tight transition-colors ${
                  isActive ? "text-primary" : "text-foreground group-hover:text-primary/80"
                }`}>
                  {model.name}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md animate-in zoom-in duration-200">
                    <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300 ${
                  isActive ? "w-2/3 bg-primary" : "w-0 bg-primary/50 group-hover:w-1/3"
                }`} />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
