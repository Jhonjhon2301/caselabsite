interface CategoryBarProps {
  active: string;
  onChange: (cat: string) => void;
  categories: string[];
}

export default function CategoryBar({ active, onChange, categories }: CategoryBarProps) {
  return (
    <div className="sticky top-[57px] sm:top-[65px] md:top-[105px] z-30 bg-background border-b border-border">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex gap-1 overflow-x-auto py-2.5 sm:py-3 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full shrink-0 transition-all duration-200 text-[11px] sm:text-xs font-bold tracking-wide uppercase ${
                active === cat
                  ? "bg-foreground text-background shadow-md"
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
