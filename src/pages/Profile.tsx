import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, MapPin, Save } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    full_name: "", phone: "", cpf: "", birth_date: "", gender: "", instagram: "",
    address_cep: "", address_street: "", address_number: "", address_complement: "",
    address_neighborhood: "", address_city: "", address_state: "",
  });

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          cpf: data.cpf || "",
          birth_date: data.birth_date || "",
          gender: data.gender || "",
          instagram: data.instagram || "",
          address_cep: data.address_cep || "",
          address_street: data.address_street || "",
          address_number: data.address_number || "",
          address_complement: data.address_complement || "",
          address_neighborhood: data.address_neighborhood || "",
          address_city: data.address_city || "",
          address_state: data.address_state || "",
        });
      }
      setLoading(false);
    });
  }, [user]);

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
        setForm(prev => ({
          ...prev,
          address_street: data.logradouro || prev.address_street,
          address_neighborhood: data.bairro || prev.address_neighborhood,
          address_city: data.localidade || prev.address_city,
          address_state: data.uf || prev.address_state,
        }));
      }
    } catch { /* ignore */ }
    setLoadingCep(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim() || null,
      phone: form.phone.trim() || null,
      cpf: form.cpf.trim() || null,
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      instagram: form.instagram.trim() || null,
      address_cep: form.address_cep.replace(/\D/g, "") || null,
      address_street: form.address_street.trim() || null,
      address_number: form.address_number.trim() || null,
      address_complement: form.address_complement.trim() || null,
      address_neighborhood: form.address_neighborhood.trim() || null,
      address_city: form.address_city.trim() || null,
      address_state: form.address_state.trim() || null,
    }).eq("user_id", user.id);

    if (error) toast.error("Erro ao salvar perfil");
    else toast.success("Perfil atualizado com sucesso!");
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const inputClass = "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Meu Perfil" description="Gerencie seus dados pessoais na Case Lab" />
      <TopBar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-heading font-bold text-2xl mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-primary" /> Meu Perfil
        </h1>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-heading font-bold text-base mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Dados Pessoais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Nome Completo</label>
                <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">E-mail</label>
                <input type="email" value={user?.email || ""} disabled className={`${inputClass} opacity-60`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">CPF</label>
                <input type="text" value={form.cpf} onChange={e => setForm({ ...form, cpf: formatCPF(e.target.value) })} className={inputClass} placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Telefone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: formatPhone(e.target.value) })} className={inputClass} placeholder="(61) 99999-9999" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Data de Nascimento</label>
                <input type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Gênero</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className={inputClass}>
                  <option value="">Selecione</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                  <option value="prefiro_nao_dizer">Prefiro não dizer</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Instagram</label>
                <input type="text" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} className={inputClass} placeholder="@seuinstagram" />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-heading font-bold text-base mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Endereço
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">CEP</label>
                <input
                  type="text" value={form.address_cep}
                  onChange={e => {
                    const v = formatCEP(e.target.value);
                    setForm({ ...form, address_cep: v });
                    if (v.replace(/\D/g, "").length === 8) fetchCep(v);
                  }}
                  className={inputClass} placeholder="00000-000"
                />
                {loadingCep && <Loader2 className="absolute right-3 top-8 w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Rua</label>
                <input type="text" value={form.address_street} onChange={e => setForm({ ...form, address_street: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Número</label>
                <input type="text" value={form.address_number} onChange={e => setForm({ ...form, address_number: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Complemento</label>
                <input type="text" value={form.address_complement} onChange={e => setForm({ ...form, address_complement: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Bairro</label>
                <input type="text" value={form.address_neighborhood} onChange={e => setForm({ ...form, address_neighborhood: e.target.value })} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Cidade</label>
                <input type="text" value={form.address_city} onChange={e => setForm({ ...form, address_city: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Estado</label>
                <input type="text" value={form.address_state} onChange={e => setForm({ ...form, address_state: e.target.value.toUpperCase().slice(0, 2) })} className={inputClass} maxLength={2} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm tracking-wider hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> SALVAR ALTERAÇÕES</>}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
