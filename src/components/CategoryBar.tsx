interface CategoryBarProps {
  active: string;
  onChange: (cat: string) => void;
  categories: string[];
}

export default function CategoryBar({ active, onChange, categories }: CategoryBarProps) {
  return (
    <div className="py-6 border-b border-border bg-background">
      <div className="container mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              className={`px-4 py-2 rounded-xl shrink-0 transition-all text-xs font-medium ${
                active === cat
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
