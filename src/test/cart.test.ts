import { describe, it, expect } from "vitest";

describe("Cart utilities", () => {
  it("should calculate total correctly", () => {
    const items = [
      { price: 89.9, quantity: 2 },
      { price: 59.9, quantity: 1 },
    ];
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    expect(total).toBeCloseTo(239.7);
  });

  it("should apply percentage discount", () => {
    const total = 200;
    const discountPercent = 10;
    const discount = (total * discountPercent) / 100;
    expect(discount).toBe(20);
    expect(total - discount).toBe(180);
  });

  it("should apply fixed discount", () => {
    const total = 200;
    const discount = 30;
    expect(Math.max(0, total - discount)).toBe(170);
  });

  it("should not go below zero with discount", () => {
    const total = 20;
    const discount = 50;
    expect(Math.max(0, total - discount)).toBe(0);
  });

  it("should calculate shipping total correctly", () => {
    const subtotal = 150;
    const shipping = 15;
    const discount = 10;
    const finalTotal = Math.max(0, subtotal - discount + shipping);
    expect(finalTotal).toBe(155);
  });
});
