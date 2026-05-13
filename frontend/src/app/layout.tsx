import type { Metadata } from "next";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { LanguageProvider } from "../context/LanguageContext";
import ConditionalLayout from "../components/common/ConditionalLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebTravel - Book your next journey",
  description: "WebTravel is a modern travel booking platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body
        className="antialiased"
      >
        <ToastProvider>
          <LanguageProvider>
            <AuthProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </AuthProvider>
          </LanguageProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
