import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ImagePlus, Package, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import { InternalStockColorQuantitiesEditor } from "@/components/admin/internal-stock/InternalStockColorQuantitiesEditor";
import type {
  EditableColorQuantity,
  InternalStockItem,
  InternalStockProductOption,
} from "@/components/admin/internal-stock/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = ["Garrafas", "Tampas", "Embalagens", "Adesivos", "Tintas", "Outros"];

const emptyForm = {
  product_id: "",
  name: "",
  description: "",
  category: "",
  quantity: "0",
  min_quantity: "0",
  unit_cost: "0",
  supplier: "",
  location: "",
  notes: "",
  sales_note: "",
  height_cm: "",
  circumference_cm: "",
  image_url: "",
};

const normalizeColorRows = (rows: EditableColorQuantity[]) =>
  rows
    .map((row) => ({
      name: row.name.trim(),
      hex: row.hex || "#000000",
      quantity: parseInt(row.quantity, 10) || 0,
    }))
    .filter((row) => row.name.length > 0);

const toEditableRows = (rows: InternalStockItem["color_quantities"]): EditableColorQuantity[] =>
  (rows ?? []).map((row) => ({
    name: row.name,
    hex: row.hex || "#000000",
    quantity: String(row.quantity ?? 0),
  }));

export default function AdminInternalStock() {
  const { user } = useAuth();
  const [items, setItems] = useState<InternalStockItem[]>([]);
  const [products, setProducts] = useState<InternalStockProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InternalStockItem | null>(null);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [colorRows, setColorRows] = useState<EditableColorQuantity[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: stockItems }, { data: productOptions }] = await Promise.all([
      supabase.from("internal_stock").select("*").order("name"),
      supabase
        .from("products")
        .select("id, name, variants, height_cm, circumference_cm")
        .order("name"),
    ]);

    const normalizedItems = ((stockItems ?? []) as unknown as Array<Record<string, any>>).map((item) => ({
      ...item,
      color_quantities: Array.isArray(item.color_quantities) ? item.color_quantities : [],
      sales_note: item.sales_note ?? null,
      product_id: item.product_id ?? null,
      image_url: item.image_url ?? null,
    })) as InternalStockItem[];

    const normalizedProducts = ((productOptions ?? []) as unknown as Array<Record<string, any>>).map(
      (product) => ({
        ...product,
        variants: Array.isArray(product.variants) ? product.variants : [],
      }),
    ) as InternalStockProductOption[];

    setItems(normalizedItems);
    setProducts(normalizedProducts);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === form.product_id) ?? null,
    [form.product_id, products],
  );

  const syncColorsFromProduct = () => {
    if (!selectedProduct?.variants?.length) {
      toast.error("Este produto não possui cores cadastradas");
      return;
    }

    const currentMap = new Map(
      colorRows.map((row) => [row.name.toLowerCase(), row.quantity]),
    );

    setColorRows(
      selectedProduct.variants.map((variant) => ({
        name: variant.name,
        hex: variant.hex || "#000000",
        quantity: currentMap.get(variant.name.toLowerCase()) || "0",
      })),
    );

    toast.success("Cores puxadas do produto");
  };

  const applyProductSelection = (productId: string) => {
    const product = products.find((item) => item.id === productId);

    setForm((prev) => ({
      ...prev,
      product_id: productId,
      name: product?.name ?? prev.name,
      category: product ? "Garrafas" : prev.category,
      height_cm: product?.height_cm != null ? String(product.height_cm) : prev.height_cm,
      circumference_cm:
        product?.circumference_cm != null
          ? String(product.circumference_cm)
          : prev.circumference_cm,
    }));

    if (product?.variants?.length) {
      setColorRows(
        product.variants.map((variant) => ({
          name: variant.name,
          hex: variant.hex || "#000000",
          quantity: "0",
        })),
      );
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setColorRows([]);
    setDialogOpen(true);
  };

  const openEdit = (item: InternalStockItem) => {
    setEditing(item);
    setForm({
      product_id: item.product_id ?? "",
      name: item.name,
      description: item.description || "",
      category: item.category || "",
      quantity: String(item.quantity),
      min_quantity: String(item.min_quantity),
      unit_cost: String(item.unit_cost),
      supplier: item.supplier || "",
      location: item.location || "",
      notes: item.notes || "",
      sales_note: item.sales_note || "",
      height_cm: item.height_cm != null ? String(item.height_cm) : "",
      circumference_cm: item.circumference_cm != null ? String(item.circumference_cm) : "",
      image_url: item.image_url || "",
    });
    setColorRows(toEditableRows(item.color_quantities));
    setDialogOpen(true);
  };

  const saveItem = async () => {
    if (!form.name.trim()) {
      toast.error("Preencha o nome do item");
      return;
    }

    const normalizedColors = normalizeColorRows(colorRows);
    const totalQuantityFromColors = normalizedColors.reduce((sum, row) => sum + row.quantity, 0);
    const typedQuantity = parseInt(form.quantity, 10) || 0;

    const payload: any = {
      product_id: form.product_id || null,
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category || null,
      quantity: normalizedColors.length > 0 ? totalQuantityFromColors : typedQuantity,
      min_quantity: parseInt(form.min_quantity, 10) || 0,
      unit_cost: parseFloat(form.unit_cost) || 0,
      supplier: form.supplier.trim() || null,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
      sales_note: form.sales_note.trim() || null,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      circumference_cm: form.circumference_cm ? parseFloat(form.circumference_cm) : null,
      color_quantities: normalizedColors,
      image_url: form.image_url.trim() || null,
    };

    if (editing) {
      const { error } = await supabase.from("internal_stock").update(payload).eq("id", editing.id);
      if (error) {
        toast.error("Erro ao atualizar");
        return;
      }
      toast.success("Item atualizado!");
    } else {
      const { error } = await supabase
        .from("internal_stock")
        .insert({ ...payload, created_by: user!.id });
      if (error) {
        toast.error("Erro ao criar item");
        return;
      }
      toast.success("Item adicionado!");
    }

    setDialogOpen(false);
    fetchData();
  };

  const deleteItem = async (item: InternalStockItem) => {
    if (!confirm(`Excluir "${item.name}"?`)) return;
    const { error } = await supabase.from("internal_stock").delete().eq("id", item.id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Item excluído");
    fetchData();
  };

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(filter.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(filter.toLowerCase()),
  );

  const lowStockCount = items.filter(
    (item) => item.quantity <= item.min_quantity && item.min_quantity > 0,
  ).length;
  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
  const fmt = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Estoque Interno</h1>
          <p className="text-sm text-muted-foreground">
            Controle privado de insumos e materiais — não visível para clientes
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Novo Item
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total de Itens</p>
          <p className="text-xl font-bold">{items.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Valor em Estoque</p>
          <p className="text-xl font-bold">{fmt(totalValue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Estoque Baixo</p>
          <p className={`text-xl font-bold ${lowStockCount > 0 ? "text-destructive" : "text-primary"}`}>
            {lowStockCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Categorias</p>
          <p className="text-xl font-bold">
            {new Set(items.map((item) => item.category).filter(Boolean)).size}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar por nome ou categoria..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <p className="py-12 text-center text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Package className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p>{items.length === 0 ? "Nenhum item cadastrado" : "Nenhum resultado encontrado"}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Item</th>
                  <th className="px-4 py-3 text-center font-medium">Categoria</th>
                  <th className="px-4 py-3 text-center font-medium">Cores</th>
                  <th className="px-4 py-3 text-center font-medium">Qtd</th>
                  <th className="px-4 py-3 text-center font-medium">Mín</th>
                  <th className="px-4 py-3 text-center font-medium">Custo Unit.</th>
                  <th className="px-4 py-3 text-center font-medium">Valor Total</th>
                  <th className="px-4 py-3 text-center font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isLow = item.quantity <= item.min_quantity && item.min_quantity > 0;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          {isLow ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> : null}
                          <div className="space-y-1">
                            <span className="font-medium">{item.name}</span>
                            {item.description ? (
                              <p className="max-w-[240px] truncate text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            ) : null}
                            {item.sales_note ? (
                              <p className="max-w-[260px] text-xs text-muted-foreground">
                                Venda: {item.sales_note}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.category ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{item.category}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                        {item.color_quantities?.length ? (
                          <div className="space-y-1">
                            {item.color_quantities.slice(0, 3).map((color) => (
                              <div key={`${item.id}-${color.name}`} className="flex items-center justify-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full border border-border"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <span>{color.name}: {color.quantity}</span>
                              </div>
                            ))}
                            {item.color_quantities.length > 3 ? (
                              <span>+{item.color_quantities.length - 3} cores</span>
                            ) : null}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isLow ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                          }`}
                        >
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{item.min_quantity}</td>
                      <td className="px-4 py-3 text-center">{fmt(item.unit_cost)}</td>
                      <td className="px-4 py-3 text-center font-medium">{fmt(item.quantity * item.unit_cost)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="rounded-lg p-2 transition-colors hover:bg-muted"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(item)}
                            className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Item" : "Novo Item de Estoque"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pr-1">
            <div>
              <Label>Vincular produto</Label>
              <select
                value={form.product_id}
                onChange={(e) => applyProductSelection(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecionar produto...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Coqueteleira"
                />
              </div>

              <div>
                <Label>Categoria</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecionar...</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalhes do item"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Altura (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.height_cm}
                  onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                />
              </div>

              <div>
                <Label>Circunferência (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.circumference_cm}
                  onChange={(e) => setForm({ ...form, circumference_cm: e.target.value })}
                />
              </div>
            </div>

            <InternalStockColorQuantitiesEditor
              rows={colorRows}
              onChange={setColorRows}
              onSyncFromProduct={syncColorsFromProduct}
              hasProductVariants={Boolean(selectedProduct?.variants?.length)}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Quantidade total</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  disabled={colorRows.length > 0}
                />
                {colorRows.length > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    A soma das cores define a quantidade total.
                  </p>
                ) : null}
              </div>

              <div>
                <Label>Qtd mínima</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.min_quantity}
                  onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
                />
              </div>

              <div>
                <Label>Custo unitário (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.unit_cost}
                  onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Fornecedor</Label>
                <Input
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder="Nome do fornecedor"
                />
              </div>

              <div>
                <Label>Localização</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Ex: Prateleira A3"
                />
              </div>
            </div>

            <div>
              <Label>Observações internas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas internas da equipe"
              />
            </div>

            <div>
              <Label>Observação comercial para vendedores</Label>
              <Textarea
                value={form.sales_note}
                onChange={(e) => setForm({ ...form, sales_note: e.target.value })}
                placeholder="Ex: A partir de 20 unidades, sair a R$ 18,90 cada"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveItem}>
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
