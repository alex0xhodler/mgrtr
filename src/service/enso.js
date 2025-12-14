import { useAccount, useChainId } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { isAddress } from "viem";
import { EnsoClient } from "@ensofinance/sdk";
import { useSendEnsoTransaction } from "./wallet";
import { DEFAULT_SLIPPAGE, ONEINCH_ONLY_TOKENS } from "./constants";
let ensoClient;
export const setApiKey = (apiKey) => {
    ensoClient = new EnsoClient({
        // baseURL: "http://localhost:3000/api/v1",
        apiKey,
    });
};
const areAddressesValid = (addresses) => typeof addresses === "string"
    ? isAddress(addresses)
    : addresses?.length > 0 && addresses.every((adr) => isAddress(adr));
export const useEnsoApprove = (tokenAddress, amount) => {
    const { address } = useAccount();
    const chainId = useChainId();
    return useQuery({
        queryKey: ["enso-approval", tokenAddress, chainId, address, amount],
        queryFn: () => ensoClient.getApprovalData({
            fromAddress: address,
            tokenAddress,
            chainId,
            amount,
        }),
        enabled: +amount > 0 && isAddress(address) && isAddress(tokenAddress),
    });
};
export const useEnsoData = ({ chainId, amountIn, tokenIn, tokenOut, slippage = DEFAULT_SLIPPAGE, active, destinationChainId, }) => {
    const { address } = useAccount();
    const wagmiChainId = useChainId();
    const addressToUse = address ?? "0x0000000000000000000000000000000000000001";
    if (!chainId)
        chainId = wagmiChainId;
    const routerParams = {
        amountIn,
        tokenIn,
        tokenOut,
        slippage,
        fromAddress: addressToUse,
        receiver: addressToUse,
        spender: addressToUse,
        routingStrategy: "router",
        chainId,
        // @ts-ignore
        destinationChainId,
    };
    if (ONEINCH_ONLY_TOKENS.includes(tokenIn) ||
        ONEINCH_ONLY_TOKENS.includes(tokenOut)) {
        // @ts-ignore
        routerParams.ignoreAggregators =
            "0x,paraswap,openocean,odos,kyberswap,native,barter";
    }
    const { data: routeData, isLoading: routeLoading } = useEnsoRouterData(routerParams, active);
    const sendTransaction = useSendEnsoTransaction(routeData?.tx, routerParams);
    return {
        routeData,
        routeLoading,
        sendTransaction,
    };
};
const useEnsoRouterData = (params, active) => useQuery({
    queryKey: [
        "enso-router",
        params.chainId,
        params.fromAddress,
        params.tokenIn,
        params.tokenOut,
        params.amountIn,
    ],
    queryFn: () => ensoClient.getRouterData(params),
    enabled: active &&
        +params.amountIn > 0 &&
        isAddress(params.fromAddress) &&
        isAddress(params.tokenIn) &&
        isAddress(params.tokenOut) &&
        params.tokenIn !== params.tokenOut,
    retry: 2,
});
export const useEnsoBundle = (params, active) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { address } = useAccount();
    const { data: bundleData, isLoading: bundleLoading, error } = useQuery({
        queryKey: ["enso-bundle", params],
        // @ts-ignore
        queryFn: () => ensoClient.getBundleData(params.options, params.actions),
        enabled: active && !!params && params.length > 0,
        retry: 1,
    });
    const sendTransaction = useSendEnsoTransaction(bundleData?.tx, params);
    return {
        bundleData,
        bundleError: error,
        bundleLoading,
        sendTransaction,
    };
};
export const useEnsoBalances = () => {
    const { address } = useAccount();
    const chainId = useChainId();
    return useQuery({
        queryKey: ["enso-balances", chainId, address],
        queryFn: () => ensoClient.getBalances({ useEoa: true, chainId, eoaAddress: address }),
        enabled: isAddress(address),
    });
};
export const useEnsoTokenDetails = ({ address, underlyingTokensExact, type, chainId, }) => {
    const wagmiChainId = useChainId();
    const enabled = areAddressesValid(address) || areAddressesValid(underlyingTokensExact);
    if (!chainId)
        chainId = wagmiChainId;
    return useQuery({
        queryKey: [
            "enso-token-details",
            address,
            underlyingTokensExact,
            chainId,
            type,
        ],
        queryFn: () => ensoClient
            .getTokenData({
            underlyingTokensExact,
            address,
            chainId,
            includeMetadata: true,
            type,
        })
            .then((data) => data.data.map((token) => ({
            ...token,
            address: token.address.toLowerCase(),
        }))),
        enabled,
    });
};
export const useEnsoToken = (address) => {
    const { data: tokens } = useEnsoTokenDetails({ address });
    const token = useMemo(() => {
        if (!tokens?.length)
            return null;
        const ensoToken = tokens[0];
        let logoURI = ensoToken.logosUri[0];
        if (!logoURI && ensoToken.underlyingTokens?.length === 1) {
            logoURI = ensoToken.underlyingTokens[0].logosUri[0];
        }
        return {
            address: ensoToken.address.toLowerCase(),
            symbol: ensoToken.symbol,
            name: ensoToken.name,
            decimals: ensoToken.decimals,
            logoURI,
            underlyingTokens: ensoToken.underlyingTokens?.map((token) => ({
                address: token.address.toLowerCase(),
                symbol: token.symbol,
                name: token.name,
                decimals: token.decimals,
                logoURI: token.logosUri[0],
            })),
        };
    }, [tokens]);
    return token;
};
export const useEnsoPrice = (address) => {
    const chainId = useChainId();
    return useQuery({
        queryKey: ["enso-token-price", address, chainId],
        queryFn: () => ensoClient.getPriceData({ address, chainId }),
        enabled: chainId && isAddress(address),
    });
};
