import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BeU Eyewear | Online Shop",
  description: "Be ur best self",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var root = document.documentElement;
    if (root.classList.contains('dark') || root.classList.contains('light')) return;
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } catch (e) {}
})();
`;

// A plain <script> in a component makes React warn in development. Marking it
// text/plain on the client (where it never runs anyway) avoids that; the
// server-rendered text/javascript copy is what the browser executes.
function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={THEME_INIT_SCRIPT} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
