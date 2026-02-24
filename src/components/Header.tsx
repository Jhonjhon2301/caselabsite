import { ShoppingCart, Instagram, Menu, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo.jpeg";
import { useState } from "react";

export default function Header() {
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-secondary/95 backdrop-blur-md border-b border-primary/20">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img src={logo} alt="Case Lab" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <span className="font-heading text-2xl text-primary-foreground tracking-wider">CASE LAB</span>
            <span className="block text-[10px] text-primary tracking-[0.3em] -mt-1">PERSONALIZADOS</span>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#produtos" className="text-sm font-medium text-primary-foreground/80 hover:text-primary transition-colors">
            Produtos
          </a>
          <a href="#sobre" className="text-sm font-medium text-primary-foreground/80 hover:text-primary transition-colors">
            Sobre
          </a>
          <a href="#contato" className="text-sm font-medium text-primary-foreground/80 hover:text-primary transition-colors">
            Contato
          </a>
          <a
            href="https://www.instagram.com/caselaboficial_/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-foreground/80 hover:text-primary transition-colors"
          >
            <Instagram className="w-5 h-5" />
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-full hover:bg-primary/20 transition-colors text-primary-foreground"
            aria-label="Abrir carrinho"
          >
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-brand text-primary-foreground text-xs font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-primary-foreground"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="md:hidden bg-secondary border-t border-primary/20 px-4 py-4 flex flex-col gap-4 animate-fade-in">
          <a href="#produtos" onClick={() => setMobileMenuOpen(false)} className="text-primary-foreground/80 hover:text-primary">Produtos</a>
          <a href="#sobre" onClick={() => setMobileMenuOpen(false)} className="text-primary-foreground/80 hover:text-primary">Sobre</a>
          <a href="#contato" onClick={() => setMobileMenuOpen(false)} className="text-primary-foreground/80 hover:text-primary">Contato</a>
          <a href="https://www.instagram.com/caselaboficial_/" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary flex items-center gap-2">
            <Instagram className="w-5 h-5" /> Instagram
          </a>
        </nav>
      )}
    </header>
  );
}
