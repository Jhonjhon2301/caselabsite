export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[] | null;
  category_id: string | null;
  is_active: boolean;
  is_customizable: boolean;
  stock_quantity: number;
  measurements: string | null;
  colors: string[] | null;
  category_name?: string;
}
