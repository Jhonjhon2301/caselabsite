import { Briefcase, Heart, Palette, Baby, Trophy, Stethoscope, Scissors, User } from "lucide-react";

const categories = [
  { id: "Todos", label: "Todos", icon: Palette },
  { id: "Empresarial", label: "Empresarial", icon: Briefcase },
  { id: "Saúde", label: "Saúde", icon: Stethoscope },
  { id: "Esporte", label: "Esporte", icon: Trophy },
  { id: "Beleza", label: "Beleza", icon: Scissors },
  { id: "Infantil", label: "Infantil", icon: Baby },
  { id: "Pessoal", label: "Pessoal", icon: User },
  { id: "Profissional", label: "Profissional", icon: Heart },
  { id: "Criativo", label: "Criativo", icon: Palette },
];

interface CategoryBarProps {
  active: string;
  onChange: (cat: string) => void;
}

export default function CategoryBar({ active, onChange }: CategoryBarProps) {
  return (
    <div className="py-6 border-b border-border bg-background">
      <div className="container mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl shrink-0 transition-all text-xs font-medium ${
                active === id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
