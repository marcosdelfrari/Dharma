import type { Metadata } from "next";
import { Mukta } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/lib/auth-context";
import { DharmaConfigProvider } from "@/lib/dharma-config";
import "@/styles/main.scss";

const mukta = Mukta({
  variable: "--font-mukta",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dharma",
  description:
    "Painel operacional para acolhimento, loja, profissionais e relatórios — gestão associativa com método.",
  icons: {
    icon: [{ url: "/dharma.webp", type: "image/webp" }],
    apple: [{ url: "/dharma.webp", type: "image/webp" }],
  },
};

const themeBootScript = `
(function(){
  try {
    var t = localStorage.getItem('dharma-theme');
    if (t !== 'light' && t !== 'dark') t = 'dark';
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={mukta.variable} data-theme="dark" suppressHydrationWarning>
      <body className="ds-scope" style={{ fontFamily: "var(--font-mukta), Mukta, sans-serif" }}>
        <Script id="dharma-theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
        <DharmaConfigProvider>
          <AuthProvider>{children}</AuthProvider>
        </DharmaConfigProvider>
      </body>
    </html>
  );
}
