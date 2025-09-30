import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Funnel_Sans } from "next/font/google";
import {
  FaDiceOne,
  FaDiceTwo,
  FaDiceThree,
  FaLock,
  FaGithub,
} from "react-icons/fa";

export const metadata: Metadata = {
  title: "Encrypted Dice Game",
  description:
    "Onchain encrypted Dice Game app powered by Zama FHEVM",
};

const funnelSans = Funnel_Sans({
  subsets: ["latin"],
  display: "swap",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={funnelSans.className} suppressHydrationWarning>
      <body className={`zama-bg text-foreground antialiased`}>
        <div className="fixed inset-0 w-full h-full zama-bg z-[-20] min-w-[850px]"></div>
        <main className="flex flex-col max-w-screen-lg mx-auto pb-20 min-w-[850px]">
          <nav className="flex w-full px-3 h-fit py-10 justify-between items-center">
            <AppLogo />
            <GitHubLink />
          </nav>
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}

function AppLogo() {
  return (
    <div className="flex items-center border-black p-1 border-2">
      <FaDiceOne className="size-10" />
      <FaDiceTwo className="size-10" />
      <FaDiceThree className="size-10" />
      <FaLock className="size-10" />
    </div>
  );
}

function GitHubLink() {
  return (
    <a
      href="https://github.com/chimmykk/hello-fhevm-dice"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center w-12 h-12 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 border-2 border-black"
      title="View on GitHub"
    >
      <FaGithub className="size-6" />
    </a>
  );
}
