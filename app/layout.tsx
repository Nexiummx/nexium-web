import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { SiteConfigProvider } from "@/components/SiteConfigProvider";
import { getSiteWaConfig } from "@/lib/wa-server";
import { SiteSchema } from "./schema";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nexiummx.com"),

  title: {
    default: "Nexium — Agencia tech · Durango, México",
    template: "%s | Nexium",
  },
  description:
    "Estudio tech en Durango: desarrollo web (landing, multi-vista, ecommerce), consultoría de digitalización y automatizaciones con IA. Hecho por ingeniería, con alma editorial.",

  keywords: [
    "agencia tech Durango",
    "desarrollo web México",
    "ecommerce Durango",
    "automatización IA",
    "consultoría digital",
    "Nexium",
  ],

  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://www.nexiummx.com",
    siteName: "Nexium",
    title: "Nexium — Agencia tech · Durango, México",
    description:
      "Desarrollo web, digitalización y automatizaciones para emprendedores que valoran su tiempo.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nexium",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Nexium — Agencia tech · Durango, México",
    description:
      "Desarrollo web, digitalización y automatizaciones para emprendedores que valoran su tiempo.",
    images: ["/og-image.png"],
  },

  alternates: {
    canonical: "https://www.nexiummx.com",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
const META_PID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  void headers();
  const waConfig = getSiteWaConfig();

  return (
    <html
      lang="es"
      className={`${instrumentSerif.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <head>
        <SiteSchema />
      </head>
      <body className="min-h-screen font-sans text-base font-normal leading-relaxed text-nex-text antialiased">
        <SiteConfigProvider value={waConfig}>
          <a href="#main" className="skip">
            Saltar al contenido
          </a>

          {children}

          <Analytics />
        </SiteConfigProvider>

        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}

        {META_PID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
