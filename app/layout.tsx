import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import RouteSidebar from "@/components/RouteSidebar";
import { getServerSession } from "@/lib/auth/server-session";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinguistPro",
  description: "LinguistPro Next.js migration scaffold",
};

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const session = await getServerSession();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar />
          <div className="flex min-h-[calc(100vh-5rem)]">
            {session ? <RouteSidebar role={session.role} /> : null}
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
