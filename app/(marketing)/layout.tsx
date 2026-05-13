import { SiteChrome } from "@/components/SiteChrome";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteChrome>
      <Header />
      {children}
      <Footer />
    </SiteChrome>
  );
}
