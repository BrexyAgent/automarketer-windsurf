import type { Database } from "@/types/database";

type Brand = Database["public"]["Tables"]["brands"]["Row"];

const SELECTED_BRAND_KEY = "automarketer.selectedBrandId";

export function getSelectedBrand(brands: Brand[]): Brand | null {
  if (typeof window === "undefined") return brands[0] || null;
  const saved = localStorage.getItem(SELECTED_BRAND_KEY);
  return brands.find((b) => b.id === saved) || brands[0] || null;
}

export function getSelectedBrandId(brands: Brand[]): string | null {
  return getSelectedBrand(brands)?.id || null;
}

export function setSelectedBrand(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SELECTED_BRAND_KEY, id);
}
