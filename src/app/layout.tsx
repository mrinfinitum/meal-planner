import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://plenty-family-meals.a360usa.chatgpt.site"),
  title: "Plenty — Your family meal planner",
  description: "Plan meals, track your kitchen, and shop smarter with one beautifully organized family hub.",
  openGraph: {
    title: "Plenty — Your family meal planner",
    description: "Plan the week. Shop once. Eat well.",
    images: [{ url: "/og.png", width: 1730, height: 909, alt: "Plenty family meal planner" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Plenty — Your family meal planner",
    description: "Plan the week. Shop once. Eat well.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
