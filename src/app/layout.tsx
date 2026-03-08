import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "RDV Emploi Public | 25 000+ offres d'emploi dans la fonction publique territoriale",
  description: "Trouvez votre emploi dans la fonction publique territoriale. Plus de 25 000 offres d'emploi territorial mises à jour quotidiennement. Grilles indiciaires, calculateur de salaire et fiches métiers.",
  keywords: "emploi public, fonction publique territoriale, offres d'emploi, mairie, collectivité, territorial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
