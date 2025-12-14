import { useQuery } from "@tanstack/react-query";
import { useChainId } from "wagmi";
import { CHAINS_ETHERSCAN, ETH_TOKEN, GECKO_CHAIN_NAMES, NATIVE_ETH_CHAINS, } from "./constants";
export const compareCaseInsensitive = (a, b) => {
    return !!(a && b && a?.toLowerCase() === b?.toLowerCase());
};
const getGeckoList = (chainName) => fetch(`https://tokens.coingecko.com/${chainName}/all.json`)
    .then((res) => res.json())
    .then((data) => data?.tokens);
const getOneInchTokenList = (chainId) => fetch("https://tokens.1inch.io/v1.2/" + chainId).then((res) => res.json());
export const useGeckoList = () => {
    const chainId = useChainId();
    const chainName = GECKO_CHAIN_NAMES[chainId];
    const { data } = useQuery({
        queryKey: ["tokenList", chainName],
        queryFn: () => getGeckoList(chainName),
        enabled: !!chainName,
    });
    if (data) {
        return NATIVE_ETH_CHAINS.includes(chainId) ? [...data, ETH_TOKEN] : data;
    }
    return [];
};
export const useOneInchTokenList = () => {
    const chainId = useChainId();
    return useQuery({
        queryKey: ["oneInchTokenList", chainId],
        queryFn: () => getOneInchTokenList(chainId),
        enabled: !!chainId,
    });
};
export const useTokenFromList = (tokenAddress) => {
    const data = useGeckoList();
    return data?.find((token) => compareCaseInsensitive(token.address, tokenAddress));
};
export const useEtherscanUrl = (address, type = "/tx") => {
    const chainId = useChainId();
    const chainPrefix = CHAINS_ETHERSCAN[chainId];
    if (address)
        return `${chainPrefix}${type}/${address}`;
};
export const capitalize = (s) => {
    if (!s)
        return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
};
export const getChainName = (chainId) => {
    const geckoName = GECKO_CHAIN_NAMES[chainId];
    return capitalize(geckoName).split("-")[0];
};
export const useDefiLlamaAPY = (poolId) => {
    return useQuery({
        queryKey: ["defillama-pools"],
        queryFn: async () => {
            try {
                const response = await fetch("https://yields.llama.fi/pools");
                const result = await response.json();
                return result.data; // Array of all pools
            }
            catch (e) {
                console.error("Failed to fetch DefiLlama Pools", e);
                return [];
            }
        },
        select: (data) => {
            const pool = data.find((p) => p.pool === poolId);
            return pool;
        },
        enabled: !!poolId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
