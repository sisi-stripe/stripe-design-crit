import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stripe Design Crit",
  description:
    "Real-time design critique workspace for structured team feedback",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">
        {children}
        <Script src="https://mcp.figma.com/mcp/html-to-design/capture.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
