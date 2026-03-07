import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Package, Plus, Pencil, Trash2, Save, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface StockItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity: number;
  min_quantity: number;
  unit_cost: number;
  supplier: string | null;
  location: string | null;
  notes: string | null;
  height_cm: number | null;
  circumference_cm: number | null;
  created_at: string;
}

const CATEGORIES = ["Garrafas", "Tampas", "Embalagens", "Adesivos", "Tintas", "Outros"];

export default function AdminInternalStock() {
  const { user } = useAuth();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", category: "", quantity: "0",
    min_quantity: "0", unit_cost: "0", supplier: "", location: "", notes: "",
    height_cm: "", circumference_cm: "",
  });

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("internal_stock")
      .select("*")
      .order("name");
    setItems((data as StockItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", category: "", quantity: "0", min_quantity: "0", unit_cost: "0", supplier: "", location: "", notes: "", height_cm: "", circumference_cm: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: StockItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || "",
      category: item.category || "",
      quantity: String(item.quantity),
      min_quantity: String(item.min_quantity),
      unit_cost: String(item.unit_cost),
      supplier: item.supplier || "",
      location: item.location || "",
      notes: item.notes || "",
      height_cm: item.height_cm != null ? String(item.height_cm) : "",
      circumference_cm: item.circumference_cm != null ? String(item.circumference_cm) : "",
    });
    setDialogOpen(true);
  };

  const saveItem = async () => {
    if (!form.name.trim()) { toast.error("Preencha o nome do item"); return; }
    const payload: any = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category || null,
      quantity: parseInt(form.quantity) || 0,
      min_quantity: parseInt(form.min_quantity) || 0,
      unit_cost: parseFloat(form.unit_cost) || 0,
      supplier: form.supplier.trim() || null,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      circumference_cm: form.circumference_cm ? parseFloat(form.circumference_cm) : null,
    };

    if (editing) {
      const { error } = await supabase.from("internal_stock").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Item atualizado!");
    } else {
      const { error } = await supabase.from("internal_stock").insert({ ...payload, created_by: user!.id });
      if (error) { toast.error("Erro ao criar item"); return; }
      toast.success("Item adicionado!");
    }
    setDialogOpen(false);
    fetchItems();
  };

  const deleteItem = async (item: StockItem) => {
    if (!confirm(`Excluir "${item.name}"?`)) return;
    const { error } = await supabase.from("internal_stock").delete().eq("id", item.id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Item excluído");
    fetchItems();
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(filter.toLowerCase()) ||
    (i.category || "").toLowerCase().includes(filter.toLowerCase())
  );

  const lowStockCount = items.filter((i) => i.quantity <= i.min_quantity && i.min_quantity > 0).length;
  const totalValue = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Estoque Interno</h1>
          <p className="text-sm text-muted-foreground">Controle privado de insumos e materiais — não visível para clientes</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Novo Item
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total de Itens</p>
          <p className="text-xl font-bold">{items.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Valor em Estoque</p>
          <p className="text-xl font-bold">{fmt(totalValue)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Estoque Baixo</p>
          <p className={`text-xl font-bold ${lowStockCount > 0 ? "text-destructive" : "text-primary"}`}>{lowStockCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Categorias</p>
          <p className="text-xl font-bold">{new Set(items.map((i) => i.category).filter(Boolean)).size}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Buscar por nome ou categoria..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground py-12 text-center">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{items.length === 0 ? "Nenhum item cadastrado" : "Nenhum resultado encontrado"}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Item</th>
                  <th className="text-center px-4 py-3 font-medium">Categoria</th>
                  <th className="text-center px-4 py-3 font-medium">Medidas</th>
                  <th className="text-center px-4 py-3 font-medium">Qtd</th>
                  <th className="text-center px-4 py-3 font-medium">Mín</th>
                  <th className="text-center px-4 py-3 font-medium">Custo Unit.</th>
                  <th className="text-center px-4 py-3 font-medium">Valor Total</th>
                  <th className="text-center px-4 py-3 font-medium">Fornecedor</th>
                  <th className="text-center px-4 py-3 font-medium w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isLow = item.quantity <= item.min_quantity && item.min_quantity > 0;
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isLow && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.category ? (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{item.category}</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                        {item.height_cm || item.circumference_cm ? (
                          <div>
                            {item.height_cm && <span>A: {item.height_cm}cm</span>}
                            {item.height_cm && item.circumference_cm && <span> · </span>}
                            {item.circumference_cm && <span>C: {item.circumference_cm}cm</span>}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isLow ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                        }`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{item.min_quantity}</td>
                      <td className="px-4 py-3 text-center">{fmt(item.unit_cost)}</td>
                      <td className="px-4 py-3 text-center font-medium">{fmt(item.quantity * item.unit_cost)}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{item.supplier || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => openEdit(item)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteItem(item)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Item" : "Novo Item de Estoque"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Tampa preta 500ml" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalhes do item" />
            </div>
            <div>
              <Label>Categoria</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecionar...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Altura (cm)</Label>
                <Input type="number" step="0.1" min="0" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} placeholder="Ex: 27" />
              </div>
              <div>
                <Label>Circunferência (cm)</Label>
                <Input type="number" step="0.1" min="0" value={form.circumference_cm} onChange={(e) => setForm({ ...form, circumference_cm: e.target.value })} placeholder="Ex: 23" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantidade</Label>
                <Input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div>
                <Label>Qtd Mínima</Label>
                <Input type="number" min="0" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Custo Unitário (R$)</Label>
              <Input type="number" step="0.01" min="0" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Nome do fornecedor" />
            </div>
            <div>
              <Label>Localização</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex: Prateleira A3" />
            </div>
            <div>
              <Label>Observações</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas internas" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveItem}>
              <Save className="w-4 h-4 mr-2" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
