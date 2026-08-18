"use client";

import { createContext, useContext, useMemo } from "react";
import { getSelectedBrandId } from "@/lib/brand";
import type { Database } from "@/types/database";
import type { User } from "@supabase/supabase-js";

type Brand = Database["public"]["Tables"]["brands"]["Row"];

interface BrandContextValue {
  user: User | null;
  brands: Brand[];
  selectedBrand: Brand | null;
  brand: Brand | null;
  orgId: string;
}

const BrandContext = createContext<BrandContextValue>({
  user: null,
  brands: [],
  selectedBrand: null,
  brand: null,
  orgId: "",
});

export function BrandProvider({
  user,
  brands,
  orgId,
  children,
}: {
  user: User | null;
  brands: Brand[];
  orgId: string;
  children: React.ReactNode;
}) {
  const selectedId = getSelectedBrandId(brands) || "";
  const selectedBrand = useMemo(
    () => brands.find((b) => b.id === selectedId) ?? brands[0] ?? null,
    [brands, selectedId]
  );

  const value = useMemo(() => ({ user, brands, selectedBrand, brand: selectedBrand, orgId }), [user, brands, selectedBrand, orgId]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  return useContext(BrandContext);
}
