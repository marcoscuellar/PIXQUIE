import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixqui — Free",
  description:
    "Clear, trustworthy threat intelligence — without the panic or noise. The calm corner of the internet.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
