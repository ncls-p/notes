import { ClientAuthProvider } from "@/components/ClientAuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--fÒont-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Noteworthy - Your AI-Powered Knowledge Hub",
  description:
    "Self-hosted, privacy-focused note-taking application with AI capabilities. Take control of your notes, your data, and your AI.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientAuthProvider>{children}</ClientAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
