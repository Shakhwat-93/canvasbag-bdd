import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import { CartProvider } from "@/components/providers/cart-provider";
import { supabaseCatalogService } from "@/lib/supabase";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://canvasbagbd.com"),
  title: "CanvasBag Bangladesh | Premium Carry",
  description:
    "Premium canvas bags built for everyday movement in Bangladesh. Confident carry, minimal styling, and nationwide cash on delivery.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon.png", type: "image/png" },
    ],
  },
};

function getThemeStyles(color: string) {
  let primary = "#ff6b35";
  let gradient = "linear-gradient(135deg, #ff804e 0%, #ff6b35 100%)";
  let foreground = "#ffffff";

  if (!color || color === "lime" || color === "orange" || color === "purple" || color === "blue" || color === "pink") {
    primary = "#ff6b35";
    gradient = "linear-gradient(135deg, #ff804e 0%, #ff6b35 100%)";
    foreground = "#ffffff";
  } else if (color.startsWith("gradient:")) {
    const parts = color.substring(9).split(",");
    const start = parts[0] || "#ff804e";
    const end = parts[1] || "#ff6b35";
    const fgType = parts[2] || "light";
    primary = start;
    gradient = `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
    foreground = fgType === "dark" ? "#111827" : "#ffffff";
  } else if (color.startsWith("hex:")) {
    const parts = color.substring(4).split(",");
    const hex = parts[0] || "#ff6b35";
    const fgType = parts[1] || "light";
    primary = hex;
    gradient = `linear-gradient(135deg, ${hex} 0%, ${hex} 100%)`;
    foreground = fgType === "dark" ? "#111827" : "#ffffff";
  }

  return { primary, gradient, foreground };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await supabaseCatalogService.getSettings();

  const gtmId = (settings.gtmId || "").trim();
  const ga4Id = (settings.ga4Id || process.env.GA4_MEASUREMENT_ID || "").trim();
  const pixelId = (settings.pixelId || process.env.FACEBOOK_PIXEL_ID || "").trim();
  const fbTestCode = (settings.fbTestCode?.trim() ? settings.fbTestCode : (process.env.FACEBOOK_TEST_EVENT_CODE || "TEST79130")).trim();
  const savedTheme = settings.themeColor || "gradient:#ff804e,#ff6b35,light";

  const { primary, gradient, foreground } = getThemeStyles(savedTheme);
  const themeCss = `:root { --primary: ${primary}; --primary-gradient: ${gradient}; --primary-foreground: ${foreground}; --primary-hover: #e55520; --price-color: #12b76a; --badge-color: #000000; }`;

  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />

        {/* Server-Injected Theme Variables */}
        <style id="theme-variables" dangerouslySetInnerHTML={{ __html: themeCss }} />

        {/* Theme Engine Runtime Script for Live Admin Previews */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.applyTheme = function(color) {
                  let primary = "#ff6b35";
                  let gradient = "linear-gradient(135deg, #ff804e 0%, #ff6b35 100%)";
                  let foreground = "#ffffff";

                  if (!color || color === "lime" || color === "orange" || color === "purple" || color === "blue" || color === "pink") {
                    primary = "#ff6b35";
                    gradient = "linear-gradient(135deg, #ff804e 0%, #ff6b35 100%)";
                    foreground = "#ffffff";
                  } else if (color.startsWith("gradient:")) {
                    const parts = color.substring(9).split(",");
                    const start = parts[0] || "#ff804e";
                    const end = parts[1] || "#ff6b35";
                    const fgType = parts[2] || "light";
                    primary = start;
                    gradient = "linear-gradient(135deg, " + start + " 0%, " + end + " 100%)";
                    foreground = fgType === "dark" ? "#111827" : "#ffffff";
                  } else if (color.startsWith("hex:")) {
                    const parts = color.substring(4).split(",");
                    const hex = parts[0] || "#ff6b35";
                    const fgType = parts[1] || "light";
                    primary = hex;
                    gradient = "linear-gradient(135deg, " + hex + " 0%, " + hex + " 100%)";
                    foreground = fgType === "dark" ? "#111827" : "#ffffff";
                  }

                  const css = ":root { --primary: " + primary + "; --primary-gradient: " + gradient + "; --primary-foreground: " + foreground + "; --primary-hover: #e55520; --price-color: #12b76a; --badge-color: #000000; }";
                  let styleEl = document.getElementById("theme-variables");
                  if (!styleEl) {
                    styleEl = document.createElement("style");
                    styleEl.id = "theme-variables";
                    document.head.appendChild(styleEl);
                  }
                  styleEl.textContent = css;
                };
              })();
            `,
          }}
        />

        {/* GTM Script */}
        {gtmId && (
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
            }}
          />
        )}

        {/* GA4 Script */}
        {ga4Id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga4-script"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${ga4Id}');
                `,
              }}
            />
          </>
        )}

        {/* Meta Pixel Script */}
        {pixelId && (
          <Script
            id="meta-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.fbTestCode = "${fbTestCode}";
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                ${fbTestCode ? `fbq('track', 'PageView', {}, { test_event_code: '${fbTestCode}' });` : `fbq('track', 'PageView');`}
              `,
            }}
          />
        )}
      </head>
      <body suppressHydrationWarning className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden text-slate-800 antialiased font-poppins selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)]">
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {pixelId && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}

        <CartProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </CartProvider>
      </body>
    </html>
  );
}