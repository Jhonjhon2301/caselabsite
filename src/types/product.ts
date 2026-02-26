export interface ProductVariant {
  name: string;
  hex: string;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  purchase_cost: number;
  images: string[] | null;
  category_id: string | null;
  is_active: boolean;
  is_customizable: boolean;
  stock_quantity: number;
  measurements: string | null;
  variants: ProductVariant[] | null;
  category_name?: string;
}
