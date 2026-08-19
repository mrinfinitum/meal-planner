import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plenty — Your family meal planner",
  description: "Plan meals, track your kitchen, and shop smarter with one beautifully organized family hub.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
