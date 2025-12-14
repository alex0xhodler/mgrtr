import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowRightLeft, TrendingUp, TrendingDown, } from "lucide-react";
import { Box, Heading, Text, HStack, useDisclosure, Card, Center, Skeleton, Flex, useBreakpointValue, } from "@chakra-ui/react";
import { isAddress } from "viem";
import { useAccount, useChainId } from "wagmi";
import { useEnsoBalances, useEnsoTokenDetails } from "@/service/enso";
import { formatNumber, formatUSD, normalizeValue } from "@/service";
import { capitalize, useDefiLlamaAPY } from "@/service/common";
import { DEFILLAMA_POOL_IDS, MOCK_POSITIONS, MONAD_TARGETS, MONAD_VAULTS, SupportedChainId } from "@/service/constants";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Toaster } from "@/components/ui/toaster";
const SourcePoolItem = ({ position, isSelected, onClick, }) => {
    const normalizedBalance = normalizeValue(position.balance.amount, position.token.decimals);
    // Fetch Real APY for Gearbox on Monad
    const poolId = position.token.chainId === SupportedChainId.MONAD &&
        position.token.address.toLowerCase() === MONAD_VAULTS.GEARBOX_USDC.toLowerCase()
        ? DEFILLAMA_POOL_IDS.GEARBOX_USDC : null;
    const { data: apyData } = useDefiLlamaAPY(poolId || "");
    const displayApy = poolId && apyData ? apyData.apy : position.token.apy;
    const displayTvl = poolId && apyData ? apyData.borrowed : position.token.tvl;
    return (_jsx(Box, { p: { base: 3, md: 4 }, shadow: "sm", rounded: "xl", cursor: "pointer", transition: "all", _hover: { shadow: "md" }, border: "2px solid", borderColor: isSelected ? "blue.500" : "transparent", onClick: onClick, width: "100%", children: _jsxs(HStack, { justify: "space-between", align: "start", flexWrap: { base: "wrap", sm: "nowrap" }, children: [_jsxs(Box, { flex: "1", minW: { base: "60%", sm: "auto" }, children: [_jsx(Text, { fontSize: { base: "sm", md: "md" }, fontWeight: "medium", children: position.token.name }), _jsx(Text, { fontSize: "xs", color: "gray.600", children: capitalize(position.token.project ?? "") }), _jsx(Text, { fontSize: { base: "xs", md: "sm" }, children: position.token.underlyingTokens
                                ?.map(({ symbol }) => symbol)
                                .join("/") }), displayTvl > 0 && (_jsxs(Text, { mt: 1, fontSize: "xs", color: "gray.600", children: ["TVL: $", formatNumber(displayTvl)] }))] }), _jsxs(Box, { textAlign: "right", children: [_jsx(Text, { fontWeight: "medium", fontSize: { base: "sm", md: "md" }, children: formatUSD(+normalizedBalance * +position.balance.price) }), _jsxs(Text, { fontSize: { base: "xs", md: "sm" }, color: "gray.600", children: [formatNumber(normalizedBalance), " ", position.token.symbol] }), (displayApy > 0 || displayApy === 0) && ( // Allow 0 to show if fetched? Or just > 0
                        _jsxs(Text, { fontSize: { base: "sm", md: "md" }, children: [displayApy?.toFixed(2), "% APY"] }))] })] }) }));
};
const TargetPoolItem = ({ token, sourceApy, onSelect, }) => {
    // Determine Pool ID for APY Fetch
    let poolId = null;
    if (token.chainId === SupportedChainId.MONAD) {
        if (token.address.toLowerCase() === MONAD_VAULTS.USDC_ASIA.toLowerCase())
            poolId = DEFILLAMA_POOL_IDS.USDC_ASIA;
        if (token.address.toLowerCase() === MONAD_VAULTS.USDC_DELTA.toLowerCase())
            poolId = DEFILLAMA_POOL_IDS.USDC_DELTA;
    }
    const { data: apyData } = useDefiLlamaAPY(poolId || "");
    const displayApy = poolId && apyData ? apyData.apy : token.apy;
    const displayTvl = poolId && apyData ? apyData.borrowed : token.tvl;
    // Debug logging
    if (poolId && apyData) {
        console.log(`Pool ${token.name}:`, { borrowed: apyData.borrowed, tvlUsd: apyData.tvlUsd, fullData: apyData });
    }
    const apyDiff = displayApy - sourceApy;
    const isPositive = apyDiff > 0;
    return (_jsx(Box, { p: { base: 3, md: 4 }, shadow: "sm", rounded: "xl", cursor: "pointer", _hover: { shadow: "md" }, onClick: onSelect, width: "100%", children: _jsxs(HStack, { justify: "space-between", align: "start", flexWrap: { base: "wrap", sm: "nowrap" }, children: [_jsxs(Box, { flex: "1", minW: { base: "60%", sm: "auto" }, children: [_jsx(Text, { fontSize: { base: "sm", md: "md" }, fontWeight: "medium", children: token.name }), _jsx(Text, { fontSize: "xs", color: "gray.600", children: capitalize(token.project) }), " ", poolId && (_jsxs(Text, { mt: 1, fontSize: "xs", color: "gray.600", children: ["TVL: ", displayTvl ? formatUSD(displayTvl) : "Loading..."] }))] }), (displayApy > 0 || displayApy === 0) && (_jsxs(Box, { textAlign: "right", children: [_jsxs(Text, { fontSize: { base: "md", md: "lg" }, fontWeight: "medium", children: [displayApy?.toFixed(2), "% APY"] }), _jsxs(HStack, { justify: "end", gap: 1, fontSize: { base: "xs", md: "sm" }, color: isPositive ? "green.500" : "red.500", children: [isPositive ? (_jsx(TrendingUp, { size: 16 })) : (_jsx(TrendingDown, { size: 16 })), sourceApy > 0 && (displayApy > 0 || displayApy === 0) && (_jsxs(Text, { color: isPositive ? "green.600" : "red.600", children: [isPositive ? "+" : "", apyDiff.toFixed(2), "% vs source"] }))] })] }))] }) }));
};
const RenderSkeletons = () => {
    const skeletonWidth = useBreakpointValue({ base: "100%", md: "340px" });
    return [1, 2, 3].map((_, i) => (_jsx(Skeleton, { rounded: "xl", h: "110px", w: skeletonWidth }, i)));
};
const usePositions = () => {
    const { data: balances, isLoading: balancesLoading } = useEnsoBalances();
    const sortedBalances = balances
        ?.slice()
        .sort((a, b) => +normalizeValue(+b.amount, b.decimals) * +b.price -
        +normalizeValue(+a.amount, a.decimals) * +a.price);
    const notEmptyBalanceAddresses = sortedBalances
        ?.filter(({ token }) => isAddress(token))
        .map((position) => position.token);
    console.log("DEBUG: notEmptyBalanceAddresses", notEmptyBalanceAddresses);
    if (balances && balances.length > 0) {
        console.log("DEBUG: first balance item", balances[0]);
        const gb = balances.find(b => b.token.toLowerCase() === "0x6b343f7b797f1488aa48c49d540690f2b2c89751");
        console.log("DEBUG: Found Gearbox in balances?", gb);
    }
    const { data: positionsTokens, isLoading: tokenLoading } = useEnsoTokenDetails({
        address: notEmptyBalanceAddresses,
        type: undefined,
    });
    console.log("DEBUG: positionsTokens", positionsTokens);
    const positions = sortedBalances
        ?.map((balance) => {
        let token = positionsTokens?.find((token) => token.address.toLowerCase() === balance.token.toLowerCase());
        if (!token) {
            // Fallback using balance data if Enso token details are missing
            token = {
                address: balance.token,
                name: balance.name || "Unknown Token",
                symbol: balance.symbol || "UNK",
                decimals: balance.decimals,
                logoURI: balance.logoUri || "",
                underlyingTokens: [],
                apy: 0,
                tvl: 0,
                project: "Unknown",
                chainId: balance.chainId,
            }; // Cast to TokenData structure
        }
        return { balance, token };
    })
        .filter(({ token }) => {
        if (!token)
            return false;
        // Filter for Monad: Only show Gearbox USDC
        if (token.chainId === SupportedChainId.MONAD) {
            return token.address.toLowerCase() === MONAD_VAULTS.GEARBOX_USDC.toLowerCase();
        }
        return true;
    });
    const positionsLoading = balancesLoading || tokenLoading;
    return {
        positions,
        positionsLoading,
    };
};
const useTargetTokens = (underlyingTokensExact, currentTokenName, chainId) => {
    const { data: underlyingTokensData, isLoading: targetLoading } = useEnsoTokenDetails({
        underlyingTokensExact,
        chainId,
    });
    /* eslint-disable-next-line prefer-const */
    let { filteredUnderlyingTokens, targetLoading: loading } = {
        filteredUnderlyingTokens: underlyingTokensData
            ?.filter((token) => token.name !== currentTokenName && token.apy > 0), targetLoading
    };
    // Note: We return the raw data here, sorting happens in component to include Monad targets
    return { filteredUnderlyingTokens, targetLoading };
};
const Home = () => {
    const [selectedSource, setSelectedSource] = useState();
    const [selectedTarget, setSelectedTarget] = useState();
    const [isDemo, setIsDemo] = useState(false);
    const { open, onOpen, onClose } = useDisclosure();
    const { address } = useAccount();
    const chainId = useChainId();
    useEffect(() => {
        // setSelectedSource(undefined); // Create persistence for cross-chain flow
    }, [chainId, address, isDemo]);
    const { positions, positionsLoading } = usePositions();
    const underlyingTokens = selectedSource?.token.underlyingTokens?.map(({ address }) => address) ?? [];
    /* eslint-disable-next-line prefer-const */
    let { filteredUnderlyingTokens: ensoTokens, targetLoading } = useTargetTokens(underlyingTokens, selectedSource?.token.name, isDemo ? 8453 : chainId);
    // Show only Monad Accountable targets
    const filteredUnderlyingTokens = MONAD_TARGETS;
    const positionsToUse = isDemo ? MOCK_POSITIONS : positions;
    const handleTargetSelect = (target) => {
        setSelectedTarget(target);
        onOpen();
    };
    // Determine if we're on mobile
    const isMobile = useBreakpointValue({ base: true, md: false });
    return (_jsxs(Box, { minH: "100vh", children: [_jsx(Toaster, {}), _jsx(Center, { children: _jsxs(Box, { mx: "auto", w: "full", maxW: "7xl", px: { base: 2, md: 4 }, py: { base: 4, md: 8 }, children: [_jsxs(Flex, { align: "center", justifyContent: "space-around", direction: { base: "column", sm: "row" }, gap: { base: 3, md: 5 }, mb: { base: 3, md: 5 }, w: "full", children: [_jsx(Box, { children: _jsxs(Heading, { display: "flex", alignItems: "center", gap: 2, fontSize: { base: "xl", md: "2xl" }, fontWeight: "bold", children: [_jsx(ArrowRightLeft, { className: "h-6 w-6" }), "Yield Migrator"] }) }), _jsx(Box, { p: { base: 2, md: 4 }, shadow: "sm", rounded: "xl", cursor: "pointer", border: "2px solid", fontWeight: "medium", borderColor: isDemo ? "blue.500" : "transparent", onClick: () => setIsDemo((val) => !val), children: "Use demo positions" })] }), _jsxs(Flex, { justifyContent: "center", direction: { base: "column", md: "row" }, gap: { base: 4, md: 6 }, w: "full", align: "start", children: [_jsx(Box, { w: { base: "full", md: "390px" }, mb: { base: 4, md: 0 }, children: _jsxs(Card.Root, { children: [_jsx(Card.Header, { children: _jsx(Heading, { size: "md", children: "Your positions" }) }), _jsx(Card.Body, { gap: 4, children: positionsLoading ? (_jsx(RenderSkeletons, {})) : positionsToUse?.length > 0 ? (positionsToUse.map((position) => (_jsx(SourcePoolItem, { position: position, isSelected: selectedSource?.token.address ===
                                                        position.token.address, onClick: () => setSelectedSource(position) }, position.token.address)))) : (_jsx(Box, { display: "flex", h: "40", alignItems: "center", justifyContent: "center", color: "gray.500", children: address ? (_jsx(Text, { children: "No positions found" })) : (_jsx(Text, { textAlign: "center", px: 2, children: "Connect your wallet or use demo to continue" })) })) })] }) }), isMobile && selectedSource && (_jsx(Flex, { justify: "center", w: "full", py: 2, children: _jsx(ArrowRight, { className: "h-6 w-6" }) })), _jsx(Box, { w: { base: "full", md: "390px" }, children: _jsxs(Card.Root, { children: [_jsx(Card.Header, { children: _jsx(Heading, { size: "md", children: "Target Pool" }) }), _jsx(Card.Body, { gap: 4, children: selectedSource ? (targetLoading ? (_jsx(RenderSkeletons, {})) : (filteredUnderlyingTokens?.map((target) => (_jsx(TargetPoolItem, { token: target, sourceApy: selectedSource?.token.apy, onSelect: () => handleTargetSelect(target) }, target.address))))) : (_jsx(Box, { display: "flex", h: "40", alignItems: "center", justifyContent: "center", color: "gray.500", children: _jsxs(HStack, { alignItems: "center", gap: 2, children: [_jsx(Text, { children: "Select a source pool" }), _jsx(ArrowRight, { className: "h-4 w-4" })] }) })) })] }) })] })] }) }), _jsx(ConfirmDialog, { open: open, onOpenChange: onClose, position: selectedSource, targetToken: selectedTarget, isDemo: isDemo })] }));
};
export default Home;
