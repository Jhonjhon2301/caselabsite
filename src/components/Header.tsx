import { ShoppingCart, Search, Menu, X, User, LogOut, Shield } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.jpeg";
import { useState } from "react";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const { totalItems, setIsCartOpen } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="container mx-auto py-3 flex items-center gap-4">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="Case Lab" className="w-9 h-9 rounded-full object-cover" />
          <div className="hidden sm:block">
            <span className="font-heading text-lg font-extrabold text-foreground leading-none tracking-tight">CASE LAB</span>
            <span className="block text-[9px] font-medium text-muted-foreground tracking-[0.25em] leading-none">PERSONALIZADOS</span>
          </div>
        </a>

        <div className="flex-1 max-w-xl mx-auto relative">
          <input
            type="text"
            placeholder="O que você está procurando?"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-full border border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* User menu */}
          {user ? (
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="p-2.5 rounded-full hover:bg-secondary transition-colors">
                <User className="w-5 h-5 text-foreground" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg py-2 z-50">
                  <p className="px-4 py-2 text-xs text-muted-foreground truncate">{user.email}</p>
                  {isAdmin && (
                    <button onClick={() => { navigate("/admin"); setUserMenuOpen(false); }} className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Painel Admin
                    </button>
                  )}
                  <button onClick={() => { signOut(); setUserMenuOpen(false); }} className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 text-destructive">
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => navigate("/auth")} className="p-2.5 rounded-full hover:bg-secondary transition-colors">
              <User className="w-5 h-5 text-foreground" />
            </button>
          )}

          <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 rounded-full hover:bg-secondary transition-colors" aria-label="Abrir carrinho">
            <ShoppingCart className="w-5 h-5 text-foreground" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2.5 rounded-full hover:bg-secondary">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <nav className="hidden md:block border-t border-border bg-background">
        <div className="container mx-auto flex items-center gap-6 py-2">
          <a href="#produtos" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">Garrafas Térmicas</a>
          <a href="#sobre" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sobre</a>
          <a href="#contato" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contato</a>
          <a href="https://wa.me/5561992629861" target="_blank" rel="noopener noreferrer" className="ml-auto text-sm font-semibold text-primary hover:underline">
            Faça seu orçamento →
          </a>
        </div>
      </nav>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-background px-4 py-3 space-y-3 animate-fade-in-up">
          <a href="#produtos" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-foreground">Garrafas Térmicas</a>
          <a href="#sobre" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground">Sobre</a>
          <a href="#contato" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground">Contato</a>
          {!user && <button onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} className="block text-sm font-semibold text-primary">Entrar / Cadastrar</button>}
          <a href="https://wa.me/5561992629861" target="_blank" rel="noopener noreferrer" className="block text-sm font-semibold text-primary">Faça seu orçamento →</a>
        </nav>
      )}
    </header>
  );
}
