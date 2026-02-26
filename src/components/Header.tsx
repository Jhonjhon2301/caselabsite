import { ShoppingCart, Search, Menu, X, User, LogOut, Shield, Gift } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.jpeg";
import { useState, useEffect } from "react";

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-xl shadow-sm" : "bg-background"
      } border-b border-border`}
    >
      <div className="container mx-auto py-3 flex items-center gap-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 shrink-0 group">
          <img src={logo} alt="Case Lab" className="w-10 h-10 rounded-full object-cover" />
          <div className="hidden sm:block">
            <span className="font-heading text-lg font-extrabold text-foreground leading-none tracking-tight">
              CASE LAB
            </span>
            <span className="block text-[8px] font-semibold text-muted-foreground tracking-[0.3em] leading-none mt-0.5">
              PERSONALIZADOS
            </span>
          </div>
        </a>

        {/* Search — GoCase style */}
        <div className="flex-1 max-w-xl mx-auto relative">
          <input
            type="text"
            placeholder="O que você está procurando?"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-full border border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
          />
          <button className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-primary rounded-full text-primary-foreground hover:brightness-110 transition-all">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-2.5 rounded-full hover:bg-secondary transition-colors"
              >
                <User className="w-5 h-5 text-foreground" />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-lg py-2 z-50">
                    <p className="px-4 py-2 text-xs text-muted-foreground truncate border-b border-border mb-1">
                      {user.email}
                    </p>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          navigate("/admin");
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2.5 transition-colors"
                      >
                        <Shield className="w-4 h-4" /> Painel Admin
                      </button>
                    )}
                    <button
                      onClick={() => {
                        signOut();
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-destructive/10 flex items-center gap-2.5 text-destructive transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="p-2.5 rounded-full hover:bg-secondary transition-colors"
              aria-label="Entrar"
            >
              <User className="w-5 h-5 text-foreground" />
            </button>
          )}

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-full hover:bg-secondary transition-colors"
            aria-label="Abrir carrinho"
          >
            <ShoppingCart className="w-5 h-5 text-foreground" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                {totalItems}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-full hover:bg-secondary transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop nav — GoCase style with icon */}
      <nav className="hidden md:block border-t border-border/60">
        <div className="container mx-auto flex items-center gap-6 py-2">
          <a
            href="#produtos"
            className="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-primary transition-colors"
          >
            <Gift className="w-4 h-4" />
            Mais Vendidos
          </a>
          <a
            href="#produtos"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Térmicos
          </a>
          <a
            href="#produtos"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Personalizados
          </a>
          <a
            href="#sobre"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Sobre
          </a>
          <a
            href="#contato"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Contato
          </a>
        </div>
      </nav>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-background px-5 py-4 space-y-3.5">
          <a href="#produtos" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-foreground uppercase">
            Mais Vendidos
          </a>
          <a href="#produtos" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground">
            Térmicos
          </a>
          <a href="#produtos" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground">
            Personalizados
          </a>
          <a href="#sobre" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground">
            Sobre
          </a>
          <a href="#contato" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground">
            Contato
          </a>
          {!user && (
            <button
              onClick={() => {
                navigate("/auth");
                setMobileMenuOpen(false);
              }}
              className="block text-sm font-semibold text-primary"
            >
              Entrar / Cadastrar
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
