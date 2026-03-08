import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [instagram, setInstagram] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const formatCPF = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  };

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const formatCEP = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
  };

  const fetchCep = async (rawCep: string) => {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setStreet(data.logradouro || "");
        setNeighborhood(data.bairro || "");
        setCity(data.localidade || "");
        setAddressState(data.uf || "");
      }
    } catch { /* ignore */ }
    setLoadingCep(false);
  };

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
      if (fullName.trim().length < 2) { toast.error("Informe seu nome completo"); setLoading(false); return; }
      if (phone.replace(/\D/g, "").length < 10) { toast.error("Informe um telefone válido"); setLoading(false); return; }
      if (cpf.replace(/\D/g, "").length !== 11) { toast.error("Informe um CPF válido"); setLoading(false); return; }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            cpf: cpf.trim(),
            birth_date: birthDate || null,
            gender: gender || null,
            instagram: instagram.trim() || null,
            address_cep: cep.replace(/\D/g, "") || null,
            address_street: street.trim() || null,
            address_number: addressNumber.trim() || null,
            address_complement: complement.trim() || null,
            address_neighborhood: neighborhood.trim() || null,
            address_city: city.trim() || null,
            address_state: addressState.trim() || null,
          },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Cadastro realizado! Verifique seu e-mail para confirmar a conta.");
      }
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none";

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
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Nome Completo *</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Seu nome completo" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CPF *</label>
                  <input type="text" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} className={inputClass} placeholder="000.000.000-00" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone / WhatsApp *</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className={inputClass} placeholder="(61) 99999-9999" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data de Nascimento</label>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gênero</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                    <option value="">Selecione (opcional)</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                    <option value="prefiro_nao_dizer">Prefiro não dizer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Instagram</label>
                  <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className={inputClass} placeholder="@seuinstagram" />
                </div>

                {/* Endereço */}
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-sm font-semibold mb-3">Endereço</p>
                  <div className="space-y-3">
                    <div className="relative">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">CEP</label>
                      <input
                        type="text"
                        value={cep}
                        onChange={(e) => {
                          const formatted = formatCEP(e.target.value);
                          setCep(formatted);
                          if (formatted.replace(/\D/g, "").length === 8) fetchCep(formatted);
                        }}
                        className={inputClass}
                        placeholder="00000-000"
                      />
                      {loadingCep && <Loader2 className="absolute right-3 top-7 w-4 h-4 animate-spin text-muted-foreground" />}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Rua</label>
                      <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} placeholder="Rua / Avenida" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Número</label>
                        <input type="text" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} className={inputClass} placeholder="Nº" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Complemento</label>
                        <input type="text" value={complement} onChange={(e) => setComplement(e.target.value)} className={inputClass} placeholder="Apto, Bloco..." />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Bairro</label>
                      <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className={inputClass} placeholder="Bairro" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Cidade</label>
                        <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="Cidade" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">UF</label>
                        <input type="text" value={addressState} onChange={(e) => setAddressState(e.target.value.toUpperCase().slice(0, 2))} className={inputClass} placeholder="DF" maxLength={2} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="seu@email.com" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
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

          <div className="mt-6 text-center space-y-2">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-foreground block w-full">
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
            {isLogin && (
              <button
                type="button"
                onClick={async () => {
                  if (!email.trim()) { toast.error("Digite seu e-mail primeiro"); return; }
                  setLoading(true);
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) toast.error(error.message);
                  else toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
                  setLoading(false);
                }}
                className="text-sm text-primary hover:underline"
              >
                Esqueceu sua senha?
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
