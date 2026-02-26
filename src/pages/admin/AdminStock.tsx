import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, Pencil, Save, X } from "lucide-react";

interface StockProduct {
  id: string;
  name: string;
  images: string[] | null;
  stock_quantity: number;
  purchase_cost: number;
  height_cm: number | null;
  circumference_cm: number | null;
  price: number;
}

export default function AdminStock() {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    stock_quantity: "",
    purchase_cost: "",
    height_cm: "",
    circumference_cm: "",
  });

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, images, stock_quantity, purchase_cost, height_cm, circumference_cm, price")
      .order("name");
    setProducts((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const startEdit = (p: StockProduct) => {
    setEditingId(p.id);
    setForm({
      stock_quantity: String(p.stock_quantity ?? 0),
      purchase_cost: String(p.purchase_cost ?? 0),
      height_cm: p.height_cm != null ? String(p.height_cm) : "",
      circumference_cm: p.circumference_cm != null ? String(p.circumference_cm) : "",
    });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    const payload = {
      stock_quantity: parseInt(form.stock_quantity) || 0,
      purchase_cost: parseFloat(form.purchase_cost) || 0,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      circumference_cm: form.circumference_cm ? parseFloat(form.circumference_cm) : null,
    };

    const { error } = await supabase.from("products").update(payload as any).eq("id", id);
    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    toast.success("Estoque atualizado!");
    setEditingId(null);
    fetchProducts();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold">Estoque</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie quantidade, custo e medidas dos produtos
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum produto cadastrado</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Produto</th>
                  <th className="text-center px-4 py-3 font-medium">Qtd</th>
                  <th className="text-center px-4 py-3 font-medium">Custo (R$)</th>
                  <th className="text-center px-4 py-3 font-medium">Venda (R$)</th>
                  <th className="text-center px-4 py-3 font-medium">Margem</th>
                  <th className="text-center px-4 py-3 font-medium">Altura (cm)</th>
                  <th className="text-center px-4 py-3 font-medium">Circunf. (cm)</th>
                  <th className="text-center px-4 py-3 font-medium w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isEditing = editingId === p.id;
                  const margin =
                    p.purchase_cost > 0
                      ? (((p.price - p.purchase_cost) / p.purchase_cost) * 100).toFixed(0)
                      : "—";

                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {/* Product info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {p.images?.[0] ? (
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-full h-full p-2 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium truncate max-w-[200px]">{p.name}</span>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={form.stock_quantity}
                            onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                            className="w-20 px-2 py-1.5 rounded-lg border border-input bg-background text-sm text-center outline-none focus:ring-2 focus:ring-ring"
                          />
                        ) : (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              p.stock_quantity <= 0
                                ? "bg-destructive/10 text-destructive"
                                : p.stock_quantity <= 5
                                ? "bg-yellow-500/10 text-yellow-600"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {p.stock_quantity}
                          </span>
                        )}
                      </td>

                      {/* Purchase cost */}
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.purchase_cost}
                            onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })}
                            className="w-24 px-2 py-1.5 rounded-lg border border-input bg-background text-sm text-center outline-none focus:ring-2 focus:ring-ring"
                          />
                        ) : (
                          <span>{Number(p.purchase_cost).toFixed(2)}</span>
                        )}
                      </td>

                      {/* Sale price */}
                      <td className="px-4 py-3 text-center font-medium">
                        {Number(p.price).toFixed(2)}
                      </td>

                      {/* Margin */}
                      <td className="px-4 py-3 text-center">
                        {margin !== "—" ? (
                          <span
                            className={`text-xs font-bold ${
                              Number(margin) >= 50
                                ? "text-primary"
                                : Number(margin) >= 20
                                ? "text-yellow-600"
                                : "text-destructive"
                            }`}
                          >
                            {margin}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Height */}
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={form.height_cm}
                            onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                            placeholder="—"
                            className="w-20 px-2 py-1.5 rounded-lg border border-input bg-background text-sm text-center outline-none focus:ring-2 focus:ring-ring"
                          />
                        ) : (
                          <span>{p.height_cm != null ? `${p.height_cm}` : "—"}</span>
                        )}
                      </td>

                      {/* Circumference */}
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={form.circumference_cm}
                            onChange={(e) =>
                              setForm({ ...form, circumference_cm: e.target.value })
                            }
                            placeholder="—"
                            className="w-20 px-2 py-1.5 rounded-lg border border-input bg-background text-sm text-center outline-none focus:ring-2 focus:ring-ring"
                          />
                        ) : (
                          <span>{p.circumference_cm != null ? `${p.circumference_cm}` : "—"}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => saveEdit(p.id)}
                              className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(p)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
