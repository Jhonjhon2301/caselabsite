import { describe, it, expect } from "vitest";

describe("Auth utilities", () => {
  it("should format CPF correctly", () => {
    const formatCPF = (v: string) => {
      const d = v.replace(/\D/g, "").slice(0, 11);
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
      if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    };
    expect(formatCPF("12345678901")).toBe("123.456.789-01");
    expect(formatCPF("123")).toBe("123");
    expect(formatCPF("1234567")).toBe("123.456.7");
  });

  it("should format phone correctly", () => {
    const formatPhone = (v: string) => {
      const d = v.replace(/\D/g, "").slice(0, 11);
      if (d.length <= 2) return `(${d}`;
      if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    };
    expect(formatPhone("61999991234")).toBe("(61) 99999-1234");
    expect(formatPhone("61")).toBe("(61");
  });

  it("should format CEP correctly", () => {
    const formatCEP = (v: string) => {
      const d = v.replace(/\D/g, "").slice(0, 8);
      if (d.length <= 5) return d;
      return `${d.slice(0, 5)}-${d.slice(5)}`;
    };
    expect(formatCEP("70000000")).toBe("70000-000");
    expect(formatCEP("700")).toBe("700");
  });
});
