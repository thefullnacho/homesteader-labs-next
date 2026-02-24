"use client";

import { CartProvider } from "@/app/context/CartContext";
import { FieldStationProvider } from "@/app/context/FieldStationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FieldStationProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </FieldStationProvider>
  );
}
