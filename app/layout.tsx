import type { Metadata } from "next";
import "./liftygo-colors.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liftygo",
  description: "Affiliate dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
