import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message);
      } else {
        toast.success("Login realizado com sucesso!");
        navigate("/");
      }
    } else {
      if (fullName.trim().length < 2) {
        toast.error("Informe seu nome completo");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName.trim());
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Cadastro realizado! Verifique seu e-mail para confirmar a conta.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar para a loja
        </button>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Case Lab" className="h-16 w-16 rounded-full object-cover" />
          </div>

          <h1 className="font-heading text-2xl font-bold text-center mb-1">
            {isLogin ? "Entrar na sua conta" : "Criar sua conta"}
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {isLogin ? "Acesse sua conta para fazer pedidos" : "Cadastre-se para começar a comprar"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none pr-12"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-brand text-primary-foreground py-3 rounded-lg font-semibold text-sm tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Carregando..." : isLogin ? "ENTRAR" : "CRIAR CONTA"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
