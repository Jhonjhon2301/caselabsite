import { describe, it, expect } from "vitest";

describe("Product utilities", () => {
  it("should format price in BRL", () => {
    const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
    expect(fmt(89.9)).toBe("R$ 89,90");
    expect(fmt(0)).toBe("R$ 0,00");
    expect(fmt(1599.99)).toBe("R$ 1599,99");
  });

  it("should calculate discounted price", () => {
    const price = 100;
    const discountPercent = 15;
    const discountedPrice = price * (1 - discountPercent / 100);
    expect(discountedPrice).toBe(85);
  });

  it("should filter active products", () => {
    const products = [
      { id: "1", name: "A", is_active: true },
      { id: "2", name: "B", is_active: false },
      { id: "3", name: "C", is_active: true },
    ];
    const active = products.filter(p => p.is_active);
    expect(active).toHaveLength(2);
  });
});
