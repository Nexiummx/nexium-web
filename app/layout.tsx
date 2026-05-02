import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { SiteSchema } from "./schema";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nexiummx.com"),

  title: {
    default: "Nexium — Digitaliza y escala tu negocio",
    template: "%s | Nexium",
  },
  description:
    "Agencia tech en Durango que ayuda a emprendedores y startups mexicanos a digitalizar y escalar su negocio con desarrollo web, consultoría y automatización.",

  keywords: [
    "agencia digital Durango",
    "desarrollo web México",
    "digitalización de negocios",
    "consultoría tecnológica PYME",
    "automatización negocios México",
    "landing page México",
    "software a medida Durango",
  ],

  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://www.nexiummx.com",
    siteName: "Nexium",
    title: "Nexium — Digitaliza y escala tu negocio",
    description:
      "Ayudamos a emprendedores mexicanos a digitalizar su negocio sin complicaciones. Desarrollo web, consultoría y automatización.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nexium — logo con wordmark",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Nexium — Digitaliza y escala tu negocio",
    description:
      "Ayudamos a emprendedores mexicanos a digitalizar su negocio sin complicaciones.",
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
  return (
    <html
      lang="es"
      className={`${barlow.variable} ${barlowCondensed.variable}`}
    >
      <head>
        <SiteSchema />
      </head>
      <body>
        <a href="#main" className="skip">
          Saltar al contenido
        </a>

        {children}

        <Analytics />

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
