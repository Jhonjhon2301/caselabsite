export interface ProductVariant {
  name: string;
  hex: string;
  price?: number;
  image?: string; // URL da imagem específica desta cor
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
  text_top?: number;
  text_left?: number;
  text_rotation?: number;
  discount_percent?: number; // 0-100, set in admin
  production_days?: number | null;
}
