import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Clientflow",
  description: "Client and project management for a web design studio.",
  icons: {
    icon: "/crm-light-logo-grey.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("h-full", "antialiased", inter.variable)}>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <LocaleProvider>
            <TooltipProvider delay={200}>
              {children}
              <Toaster position="bottom-right" />
            </TooltipProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
