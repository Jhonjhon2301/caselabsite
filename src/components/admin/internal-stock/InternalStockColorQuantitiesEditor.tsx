import { Plus, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EditableColorQuantity } from "./types";

interface InternalStockColorQuantitiesEditorProps {
  rows: EditableColorQuantity[];
  onChange: (rows: EditableColorQuantity[]) => void;
  onSyncFromProduct?: () => void;
  hasProductVariants?: boolean;
}

export function InternalStockColorQuantitiesEditor({
  rows,
  onChange,
  onSyncFromProduct,
  hasProductVariants = false,
}: InternalStockColorQuantitiesEditorProps) {
  const updateRow = (index: number, key: keyof EditableColorQuantity, value: string) => {
    onChange(
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    );
  };

  const addRow = () => {
    onChange([...rows, { name: "", hex: "#000000", quantity: "0" }]);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <div className="space-y-3 rounded-xl border border-border p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label>Cores e quantidades</Label>
          <p className="text-xs text-muted-foreground">
            Controle quantas unidades existem de cada cor deste item.
          </p>
        </div>

        <div className="flex gap-2">
          {hasProductVariants && onSyncFromProduct ? (
            <Button type="button" variant="outline" size="sm" onClick={onSyncFromProduct}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Puxar cores do produto
            </Button>
          ) : null}

          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar cor
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          Nenhuma cor cadastrada ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={`${row.name}-${row.hex}-${index}`}
              className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_88px_110px_40px]"
            >
              <div>
                <Label className="text-xs text-muted-foreground">Cor</Label>
                <Input
                  value={row.name}
                  onChange={(e) => updateRow(index, "name", e.target.value)}
                  placeholder="Ex: Branco"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Hex</Label>
                <Input
                  type="color"
                  value={row.hex}
                  onChange={(e) => updateRow(index, "hex", e.target.value)}
                  className="h-10 p-1"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Quantidade</Label>
                <Input
                  type="number"
                  min="0"
                  value={row.quantity}
                  onChange={(e) => updateRow(index, "quantity", e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(index)}
                  aria-label={`Remover cor ${row.name || index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
