import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "5561992629861";

interface CheckoutFormProps {
  onBack: () => void;
}

export default function CheckoutForm({ onBack }: CheckoutFormProps) {
  const { items, clearCart, setIsCartOpen } = useCart();
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = "Informe seu nome completo";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "E-mail inválido";
    if (!form.whatsapp.trim() || form.whatsapp.replace(/\D/g, "").length < 10) errs.whatsapp = "WhatsApp inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const itemsList = items
      .map((i) => `• ${i.quantity}x ${i.product.name} (${i.product.category})`)
      .join("%0A");

    const message = encodeURIComponent(
      `🧴 *Novo Pedido - CASE LAB*\n\n` +
      `*Cliente:* ${form.name.trim()}\n` +
      `*E-mail:* ${form.email.trim()}\n` +
      `*WhatsApp:* ${form.whatsapp.trim()}\n\n` +
      `*Itens do pedido:*\n`
    ) + "%0A" + itemsList + "%0A%0A" + encodeURIComponent("Olá! Gostaria de fazer esse pedido. 😊");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(url, "_blank");

    toast.success("Redirecionando para o WhatsApp!");
    clearCart();
    setIsCartOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar ao carrinho
        </button>

        <p className="text-sm text-muted-foreground">
          Preencha seus dados para enviar o pedido via WhatsApp.
        </p>

        <div>
          <label className="block text-sm font-medium mb-1">Nome Completo</label>
          <input
            type="text"
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
            placeholder="Seu nome completo"
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">E-mail</label>
          <input
            type="email"
            maxLength={255}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
            placeholder="seu@email.com"
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">WhatsApp</label>
          <input
            type="tel"
            maxLength={20}
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
            placeholder="(61) 99999-9999"
          />
          {errors.whatsapp && <p className="text-xs text-destructive mt-1">{errors.whatsapp}</p>}
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <h4 className="font-semibold text-sm mb-2">Resumo do pedido:</h4>
          {items.map((i) => (
            <p key={i.product.id} className="text-sm text-muted-foreground">
              {i.quantity}x {i.product.name}
            </p>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <button
          type="submit"
          className="w-full gradient-brand text-primary-foreground py-4 rounded-lg font-semibold text-sm tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          ENVIAR PEDIDO VIA WHATSAPP
        </button>
      </div>
    </form>
  );
}
