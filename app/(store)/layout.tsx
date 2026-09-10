import React from "react";
import { supabaseCatalogService } from "@/lib/supabase";
import { StoreShell } from "@/components/store/store-shell";
import { Footer } from "@/components/store/footer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { MobileFloatingCart } from "@/components/store/mobile-floating-cart";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { FloatingContact } from "@/components/store/floating-contact";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([
    supabaseCatalogService.getSettings(),
    supabaseCatalogService.getCategories(),
  ]);

  return (
    <>
      {/* Shell with AnnouncementBar, Header, and Dynamic Content Padding */}
      <StoreShell settings={settings} categories={categories}>
        {children}
      </StoreShell>

      {/* Store Footer */}
      <Footer categories={categories} settings={settings} />

      {/* Global Interactive Widgets */}
      <CartDrawer />
      <MobileFloatingCart />
      <MobileBottomNav />
      <FloatingContact settings={settings} />
    </>
  );
}
