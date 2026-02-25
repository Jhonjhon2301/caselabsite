interface CategoryBarProps {
  active: string;
  onChange: (cat: string) => void;
  categories: string[];
}

export default function CategoryBar({ active, onChange, categories }: CategoryBarProps) {
  return (
    <div className="sticky top-[105px] z-30 py-4 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              className={`px-5 py-2 rounded-full shrink-0 transition-all duration-200 text-xs font-semibold tracking-wide ${
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
