import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Text, VStack, HStack, Box, Flex, Grid, useBreakpointValue, Input, Badge, SimpleGrid, } from "@chakra-ui/react";
import { DialogRoot, DialogContent, DialogTitle, DialogDescription, DialogCloseTrigger } from "@/components/ui/dialog";
import { Shield, Lock, ArrowRight, Wallet, Activity, Zap } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { useEnsoBundle } from "@/service/enso";
import { useApproveIfNecessary } from "@/service/wallet";
import { capitalize, useDefiLlamaAPY } from "@/service/common";
import { normalizeValue } from "@/service";
import { DEFILLAMA_POOL_IDS, MONAD_VAULTS, SupportedChainId, MONAD_USDC_ADDRESS, ENSO_ROUTER_ADDRESS } from "@/service/constants";
import { useEffect, useState, useMemo } from "react";
import { parseUnits, formatUnits } from "viem";
const ConfirmDialog = ({ open, onOpenChange, position, targetToken, isDemo, }) => {
    const { address } = useAccount();
    const currentChainId = useChainId();
    const [displayAmount, setDisplayAmount] = useState("");
    const [pendingMigration, setPendingMigration] = useState(false);
    useEffect(() => {
        if (open && position) {
            setDisplayAmount(normalizeValue(position.balance.amount, position.token.decimals));
        }
    }, [open, position]);
    const rawAmount = position?.token?.decimals && displayAmount && !isNaN(parseFloat(displayAmount))
        ? parseUnits(displayAmount, position.token.decimals).toString()
        : "0";
    const isMonad = position?.token?.chainId === SupportedChainId.MONAD;
    const isCrossChain = position?.token?.chainId && targetToken?.chainId && position.token.chainId !== targetToken.chainId;
    const sourcePoolId = position?.token?.chainId === SupportedChainId.MONAD &&
        position?.token?.address.toLowerCase() === MONAD_VAULTS.GEARBOX_USDC.toLowerCase()
        ? DEFILLAMA_POOL_IDS.GEARBOX_USDC : null;
    const { data: sourceApyData } = useDefiLlamaAPY(sourcePoolId || "");
    const sourceDisplayApy = sourcePoolId && sourceApyData ? sourceApyData.apy : position?.token?.apy;
    let targetPoolId = null;
    if (targetToken?.chainId === SupportedChainId.MONAD) {
        if (targetToken?.address.toLowerCase() === MONAD_VAULTS.USDC_ASIA.toLowerCase())
            targetPoolId = DEFILLAMA_POOL_IDS.USDC_ASIA;
        if (targetToken?.address.toLowerCase() === MONAD_VAULTS.USDC_DELTA.toLowerCase())
            targetPoolId = DEFILLAMA_POOL_IDS.USDC_DELTA;
    }
    const { data: targetApyData } = useDefiLlamaAPY(targetPoolId || "");
    const targetDisplayApy = targetPoolId && targetApyData ? targetApyData.apy : targetToken?.apy;
    const displayApyDifference = (targetDisplayApy - sourceDisplayApy).toFixed(2);
    const bundleParams = useMemo(() => {
        if (!position || !targetToken || !address || +rawAmount === 0)
            return null;
        const options = {
            chainId: position.token.chainId,
            fromAddress: address,
            routingStrategy: "router",
        };
        if (isCrossChain) {
            return {
                options,
                actions: [
                    {
                        protocol: "enso",
                        action: "route",
                        args: {
                            tokenIn: position.token.address,
                            tokenOut: MONAD_USDC_ADDRESS,
                            amountIn: rawAmount,
                            destinationChainId: SupportedChainId.MONAD,
                            refundReceiver: address,
                        },
                    },
                ],
            };
        }
        else if (isMonad) {
            return {
                options,
                actions: [
                    {
                        protocol: "enso",
                        action: "route",
                        args: {
                            tokenIn: position.token.address,
                            tokenOut: MONAD_USDC_ADDRESS,
                            amountIn: rawAmount,
                        },
                    },
                    {
                        protocol: "enso",
                        action: "route",
                        args: {
                            tokenIn: MONAD_USDC_ADDRESS,
                            tokenOut: targetToken.address,
                            amountIn: "100%",
                        },
                    },
                ],
            };
        }
        return null;
    }, [position, targetToken, address, rawAmount, isCrossChain, isMonad]);
    const { bundleData, bundleLoading, bundleError, sendTransaction } = useEnsoBundle(bundleParams, open && !!bundleParams);
    const approve = useApproveIfNecessary(position?.token.address, rawAmount, bundleData?.tx?.to || ENSO_ROUTER_ADDRESS);
    const approveNeeded = !!approve && +rawAmount > 0 && !!position?.token.address;
    const isMobile = useBreakpointValue({ base: true, md: false });
    useEffect(() => {
        if (pendingMigration && !approveNeeded && bundleData?.tx) {
            sendTransaction.send();
            setPendingMigration(false);
        }
    }, [pendingMigration, approveNeeded, bundleData, sendTransaction]);
    const handlePercentage = (percent) => {
        if (position?.balance?.amount && position?.token?.decimals) {
            const totalRaw = BigInt(position.balance.amount);
            const newRaw = totalRaw * BigInt(Math.floor(percent)) / 100n;
            setDisplayAmount(formatUnits(newRaw, position.token.decimals));
        }
    };
    const usdValue = position?.balance?.price ?
        (parseFloat(displayAmount || "0") * position.balance.price).toFixed(2) : "0.00";
    const isButtonDisabled = isDemo || bundleLoading || !bundleData?.tx || pendingMigration;
    // DESIGN TOKENS
    const neonGreen = "#1BD596"; // On-brand Green
    const darkBg = "#050505";
    const cardBg = "#0A0A0A";
    const borderColor = "#1A1A1A";
    return (_jsx(DialogRoot, { open: open, onOpenChange: onOpenChange, children: _jsx(DialogContent, { className: "max-w-7xl", style: {
                width: '95vw',
                maxWidth: '1000px',
                padding: 0,
                background: 'transparent',
                boxShadow: 'none',
                border: 'none',
            }, children: _jsxs(Box, { bg: cardBg, _dark: { bg: cardBg, borderColor: "whiteAlpha.100" }, borderRadius: "3xl", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9)", position: "relative", border: "1px", borderColor: "whiteAlpha.200", color: "white", children: [_jsx(Box, { position: "absolute", top: "-20%", right: "-10%", width: "500px", height: "500px", bg: neonGreen, filter: "blur(160px)", opacity: 0.06, pointerEvents: "none" }), _jsx(Box, { position: "absolute", bottom: "-20%", left: "-10%", width: "500px", height: "500px", bg: neonGreen, filter: "blur(160px)", opacity: 0.03, pointerEvents: "none" }), _jsx(Box, { p: 8, pb: 4, position: "relative", zIndex: 1, children: _jsxs(Flex, { justify: "space-between", align: "start", mb: 4, children: [_jsxs(Box, { children: [_jsxs(HStack, { mb: 2, children: [_jsx(Badge, { bg: "whiteAlpha.100", color: neonGreen, fontSize: "xx-small", px: 2, py: 0.5, borderRadius: "full", children: "YIELD" }), _jsx(Badge, { bg: "whiteAlpha.100", color: "gray.400", fontSize: "xx-small", px: 2, py: 0.5, borderRadius: "full", children: "MIGRATION" })] }), _jsx(DialogTitle, { fontSize: "3xl", fontWeight: "800", letterSpacing: "-0.5px", fontFamily: "system-ui, sans-serif", children: "Migrate Position" }), _jsx(DialogDescription, { fontSize: "md", color: "gray.500", mt: 1, children: "Upgrade your capital efficiency to the highest yield" })] }), _jsx(DialogCloseTrigger, { position: "static", color: "gray.400", _hover: { color: "white" } })] }) }), _jsx(Box, { px: 8, py: 2, maxH: "75vh", overflowY: "auto", position: "relative", zIndex: 1, children: _jsxs(VStack, { gap: 8, align: "stretch", children: [_jsxs(Box, { children: [_jsxs(Flex, { justify: "space-between", align: "baseline", mb: 3, children: [_jsx(Text, { fontSize: "xs", fontWeight: "bold", color: "gray.500", letterSpacing: "1px", textTransform: "uppercase", children: "Amount to Migrate" }), _jsxs(Text, { fontSize: "xs", color: "gray.500", children: ["Available: ", _jsxs(Text, { as: "span", fontWeight: "bold", color: neonGreen, children: [normalizeValue(position?.balance?.amount, position?.token?.decimals), " ", position?.token?.symbol] })] })] }), _jsxs(Box, { bg: "#000000", borderRadius: "xl", border: "1px solid", borderColor: borderColor, p: 6, position: "relative", children: [_jsxs(Flex, { align: "center", gap: 4, children: [_jsx(Input, { variant: "flushed", border: "none", placeholder: "0.00", value: displayAmount, onChange: (e) => setDisplayAmount(e.target.value), fontSize: "5xl", fontWeight: "800", letterSpacing: "-1px", color: "white", _placeholder: { color: "gray.700" }, step: "any", type: "number" }), _jsxs(VStack, { align: "end", gap: 0, flexShrink: 0, children: [_jsx(HStack, { gap: 2, mb: 1, children: _jsx(Text, { fontSize: "xl", fontWeight: "bold", color: "gray.300", children: position?.token?.symbol }) }), _jsxs(Text, { fontSize: "sm", color: "gray.600", fontWeight: "medium", children: ["\u2248 $", usdValue] })] })] }), _jsx(HStack, { gap: 2, mt: 4, children: [25, 50, 75, 100].map((percent) => (_jsx(Button, { size: "xs", variant: "ghost", borderRadius: "full", color: "gray.500", bg: "whiteAlpha.50", _hover: { bg: "whiteAlpha.200", color: neonGreen }, onClick: () => handlePercentage(percent), fontSize: "xs", fontWeight: "bold", border: "1px solid", borderColor: "transparent", _active: { bg: "whiteAlpha.300", borderColor: neonGreen }, children: percent === 100 ? "MAX" : `${percent}%` }, percent))) })] })] }), _jsxs(Box, { children: [_jsx(Text, { fontSize: "xs", fontWeight: "bold", color: "gray.500", letterSpacing: "1px", textTransform: "uppercase", mb: 3, children: "Vault Comparison" }), _jsxs(Grid, { templateColumns: { base: "1fr", md: "1fr auto 1fr" }, gap: 4, alignItems: "stretch", children: [_jsxs(Box, { p: 5, borderRadius: "xl", border: "1px solid", borderColor: borderColor, bg: "whiteAlpha.50", children: [_jsx(Badge, { bg: "whiteAlpha.100", color: "gray.400", fontSize: "xx-small", mb: 3, children: "CURRENT" }), _jsx(Text, { fontSize: "xl", fontWeight: "bold", mb: 1, children: position?.token?.symbol }), _jsx(Text, { fontSize: "xs", color: "gray.500", mb: 4, children: capitalize(position?.token?.protocolSlug || "Wallet") }), _jsx(HStack, { justify: "space-between", align: "end", children: _jsxs(Box, { children: [_jsx(Text, { fontSize: "xs", color: "gray.500", children: "APY" }), _jsxs(Text, { fontSize: "2xl", fontWeight: "bold", color: "gray.400", children: [sourceDisplayApy?.toFixed(2), "%"] })] }) })] }), _jsx(Flex, { justify: "center", direction: { base: "row", md: "column" }, gap: 2, align: "center", color: "gray.700", children: _jsx(ArrowRight, { size: 20 }) }), _jsxs(Box, { p: 5, borderRadius: "xl", border: "1px solid", borderColor: neonGreen, bgGradient: `linear(to-br, ${neonGreen}05, transparent)`, position: "relative", overflow: "hidden", boxShadow: `0 0 30px -10px ${neonGreen}20`, children: [_jsx(Box, { position: "absolute", top: 0, left: 0, w: "100%", h: "2px", bg: neonGreen, opacity: 0.5, boxShadow: `0 0 10px ${neonGreen}` }), _jsxs(Flex, { justify: "space-between", align: "start", mb: 3, children: [_jsx(Badge, { bg: neonGreen, color: "black", fontSize: "xx-small", fontWeight: "bold", children: "TARGET" }), _jsx(Zap, { size: 16, color: neonGreen, fill: neonGreen })] }), _jsx(Text, { fontSize: "xl", fontWeight: "bold", color: "white", mb: 1, children: targetToken?.symbol }), _jsx(Text, { fontSize: "xs", color: neonGreen, opacity: 0.8, mb: 4, children: capitalize(targetToken?.protocolSlug || "Vault") }), _jsxs(HStack, { justify: "space-between", align: "end", children: [_jsxs(Box, { children: [_jsx(Text, { fontSize: "xs", color: "gray.400", children: "PROJECTED APY" }), _jsx(Text, { fontSize: "3xl", fontWeight: "900", color: neonGreen, letterSpacing: "-1px", textShadow: `0 0 20px ${neonGreen}40`, children: targetDisplayApy ? `${targetDisplayApy.toFixed(2)}%` : "..." })] }), Number(displayApyDifference) > 0 && (_jsxs(Badge, { bg: "whiteAlpha.100", color: neonGreen, border: `1px solid ${neonGreen}40`, children: ["+", displayApyDifference, "% boost"] }))] })] })] })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 3 }, gap: 4, children: [_jsxs(HStack, { p: 3, borderRadius: "lg", bg: "whiteAlpha.50", gap: 3, border: "1px solid", borderColor: "whiteAlpha.50", children: [_jsx(Shield, { size: 16, color: neonGreen }), _jsxs(Box, { children: [_jsx(Text, { fontSize: "xs", fontWeight: "bold", color: "gray.300", children: "Audited" }), _jsx(Text, { fontSize: "xs", color: "gray.600", children: "verified source" })] })] }), _jsxs(HStack, { p: 3, borderRadius: "lg", bg: "whiteAlpha.50", gap: 3, border: "1px solid", borderColor: "whiteAlpha.50", children: [_jsx(Lock, { size: 16, color: neonGreen }), _jsxs(Box, { children: [_jsx(Text, { fontSize: "xs", fontWeight: "bold", color: "gray.300", children: "Non-Custodial" }), _jsx(Text, { fontSize: "xs", color: "gray.600", children: "funds stay yours" })] })] }), _jsxs(HStack, { p: 3, borderRadius: "lg", bg: "whiteAlpha.50", gap: 3, border: "1px solid", borderColor: "whiteAlpha.50", children: [_jsx(Activity, { size: 16, color: neonGreen }), _jsxs(Box, { children: [_jsx(Text, { fontSize: "xs", fontWeight: "bold", color: "gray.300", children: "Route" }), _jsx(Text, { fontSize: "xs", color: "gray.600", children: isCrossChain ? "Cross-chain" : "Single-chain" })] })] })] }), bundleError && (_jsxs(Box, { bg: "red.900", p: 4, borderRadius: "xl", border: "1px solid", borderColor: "red.500", children: [_jsx(Text, { fontSize: "sm", fontWeight: "bold", color: "red.200", mb: 1, children: "Transaction Error" }), _jsx(Text, { fontSize: "xs", color: "red.300", fontFamily: "monospace", children: String(bundleError) })] }))] }) }), _jsxs(Box, { p: 8, pt: 4, bg: "transparent", position: "relative", zIndex: 2, children: [!isDemo ? (_jsx(Button, { w: "100%", size: "xl", h: "64px", bg: neonGreen, color: "black", _hover: { bg: "#00CC7D", transform: "translateY(-1px)", boxShadow: `0 0 30px ${neonGreen}40` }, _active: { transform: "translateY(0)" }, _disabled: {
                                    bg: "gray.800",
                                    color: "gray.500",
                                    cursor: "not-allowed",
                                    boxShadow: "none",
                                    opacity: 1,
                                    border: "1px solid",
                                    borderColor: "whiteAlpha.100"
                                }, fontSize: "lg", fontWeight: "800", borderRadius: "xl", transition: "all 0.2s", disabled: isButtonDisabled, letterSpacing: "0.5px", onClick: () => {
                                    if (approveNeeded) {
                                        approve?.write();
                                        setPendingMigration(true);
                                    }
                                    else {
                                        sendTransaction.send();
                                    }
                                }, children: (() => {
                                    if (bundleLoading)
                                        return _jsxs(HStack, { children: [_jsx(Activity, { className: "animate-spin" }), " ", _jsx(Text, { children: "CALCULATING ROUTE..." })] });
                                    if (approveNeeded)
                                        return _jsxs(HStack, { children: [_jsx(Lock, { size: 20 }), " ", _jsx(Text, { children: "APPROVE ACCESS" })] });
                                    if (sendTransaction.isLoading)
                                        return _jsxs(HStack, { children: [_jsx(Activity, { className: "animate-spin" }), " ", _jsx(Text, { children: "PROCESSING..." })] });
                                    return _jsxs(HStack, { children: [_jsx(Wallet, { size: 20 }), " ", _jsx(Text, { children: "CONFIRM MIGRATION" })] });
                                })() })) : (_jsx(Button, { w: "100%", size: "lg", disabled: true, variant: "outline", children: "DEMO MODE" })), isCrossChain && (_jsx(Text, { textAlign: "center", mt: 4, fontSize: "xs", color: "gray.600", fontFamily: "monospace", children: "ESTIMATED TIME: 4-8 MINUTES \u2022 POWERED BY ENSO" })), _jsx(Box, { mt: 6, pt: 4, borderTop: "1px dashed", borderColor: "whiteAlpha.100", children: _jsxs(Text, { fontSize: "xx-small", color: "gray.800", fontFamily: "monospace", children: ["DEBUG: BUNDLE=", bundleData?.tx ? "OK" : "NO", " | LOADING=", bundleLoading ? "YES" : "NO", " | PARAMS=", bundleParams ? "OK" : "NULL", bundleError && ` | ERROR=${String(bundleError).substring(0, 30)}...`] }) })] })] }) }) }));
};
export default ConfirmDialog;
