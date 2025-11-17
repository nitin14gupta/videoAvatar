import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import { ToastProvider } from "@/src/context/ToastContext";
import { AuthProvider } from "@/src/context/AuthContext";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "VideoAvatar - AI Conversational Avatar Platform",
  description: "Experience the future of AI avatars with neural-powered conversational technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="smooth-scroll">
      <body
        className={`${orbitron.variable} ${inter.variable} antialiased`}
      >
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
