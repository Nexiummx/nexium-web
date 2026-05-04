import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video Tool — Nexium",
  robots: { index: false, follow: false },
};

export default function VideoToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
