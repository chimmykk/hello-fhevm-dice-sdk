"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { MetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import { MetaMaskEthersSignerProvider } from "@/hooks/metamask/useMetaMaskEthersSigner";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <MetaMaskProvider>
        <MetaMaskEthersSignerProvider
          initialMockChains={{
            11155111:
              "https://sepolia.infura.io/v3/9aadf67222e842aba70a6238829e66cc",
          }}
        >
          <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
        </MetaMaskEthersSignerProvider>
      </MetaMaskProvider>
    </QueryClientProvider>
  );
}
