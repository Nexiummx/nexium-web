import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Slides Tool — Nexium",
  robots: { index: false, follow: false },
};

export default function SlidesToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
