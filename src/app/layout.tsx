import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Cursor } from "@/components/cursor";

const jakarta = localFont({ src: "./fonts/PlusJakartaSans-Variable.woff2", weight: "200 800", variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Columbia Laughs · Admin", template: "%s · Admin" },
  description: "The admin area for Columbia Laughs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <Nav />
        <div className="flex-1">{children}</div>
        <Cursor />
      </body>
    </html>
  );
}
