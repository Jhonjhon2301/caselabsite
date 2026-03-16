import type { ProductVariant } from "@/types/product";

export interface InternalStockColorQuantity {
  name: string;
  hex: string;
  quantity: number;
}

export interface EditableColorQuantity {
  name: string;
  hex: string;
  quantity: string;
}

export interface InternalStockItem {
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
  sales_note: string | null;
  height_cm: number | null;
  circumference_cm: number | null;
  product_id: string | null;
  color_quantities: InternalStockColorQuantity[] | null;
  created_at: string;
}

export interface InternalStockProductOption {
  id: string;
  name: string;
  variants: ProductVariant[] | null;
  height_cm: number | null;
  circumference_cm: number | null;
}
