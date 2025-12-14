import { jsx as _jsx } from "react/jsx-runtime";
import { darkTheme, getDefaultConfig, lightTheme, RainbowKitProvider, } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { arbitrum, mainnet } from "viem/chains";
import { defineChain } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorMode } from "@/components/ui/color-mode";
const monad = defineChain({
    id: 143,
    name: "Monad Mainnet",
    nativeCurrency: {
        decimals: 18,
        name: "Monad",
        symbol: "MON",
    },
    rpcUrls: {
        default: { http: ["https://monad-mainnet.drpc.org"] },
    },
    blockExplorers: {
        default: { name: "Explorer", url: "https://monadexplorer.com" },
    },
});
const base = defineChain({
    id: 8453,
    name: "Base",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpcUrls: {
        default: { http: ["https://base.meowrpc.com"] },
    },
    blockExplorers: {
        default: { name: "BaseScan", url: "https://basescan.org" },
    },
});
const config = getDefaultConfig({
    appName: "Accountable Yield Upgrader",
    projectId: "YOUR_PROJECT_ID",
    chains: [mainnet, arbitrum, base, monad],
    ssr: false,
});
const queryClient = new QueryClient();
const Providers = ({ children }) => {
    const { colorMode } = useColorMode();
    return (_jsx(WagmiProvider, { config: config, children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(RainbowKitProvider, { theme: colorMode === "dark" ? darkTheme() : lightTheme(), children: children }) }) }));
};
export default Providers;
