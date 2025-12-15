import {
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Flex,
  Grid,
  useBreakpointValue,
  Input,
  Badge,
  SimpleGrid,
} from "@chakra-ui/react";
import { DialogRoot, DialogContent, DialogTitle, DialogDescription, DialogCloseTrigger } from "@/components/ui/dialog";
import { Shield, Lock, TrendingUpIcon, ArrowRight, Wallet, Activity, Zap } from "lucide-react";
import { TokenData } from "@ensofinance/sdk";
import { useAccount, useChainId } from "wagmi";
import { useEnsoBundle } from "@/service/enso";
import { useApproveIfNecessary } from "@/service/wallet";
import { capitalize, useDefiLlamaAPY } from "@/service/common";
import { normalizeValue } from "@/service";
import { DEFILLAMA_POOL_IDS, MONAD_VAULTS, SupportedChainId, MONAD_USDC_ADDRESS, ENSO_ROUTER_ADDRESS } from "@/service/constants";
import { useEffect, useState, useMemo } from "react";
import { parseUnits, formatUnits } from "viem";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Position } from "@/types";

const ConfirmDialog = ({
  open,
  onOpenChange,
  position,
  targetToken,
  isDemo,
}: {
  targetToken?: TokenData;
  position?: Position;
  open: boolean;
  onOpenChange: (open: any) => void;
  isDemo?: boolean;
}) => {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
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
    if (targetToken?.address.toLowerCase() === MONAD_VAULTS.USDC_ASIA.toLowerCase()) targetPoolId = DEFILLAMA_POOL_IDS.USDC_ASIA;
    if (targetToken?.address.toLowerCase() === MONAD_VAULTS.USDC_DELTA.toLowerCase()) targetPoolId = DEFILLAMA_POOL_IDS.USDC_DELTA;
  }
  const { data: targetApyData } = useDefiLlamaAPY(targetPoolId || "");
  const targetDisplayApy = targetPoolId && targetApyData ? targetApyData.apy : targetToken?.apy;

  const displayApyDifference = (targetDisplayApy - sourceDisplayApy).toFixed(2);

  const bundleParams = useMemo(() => {
    if (!position || !targetToken || !address || +rawAmount === 0) return null;

    const options = {
      chainId: position.token.chainId,
      fromAddress: address,
      routingStrategy: "router" as const,
    };

    if (isCrossChain) {
      return {
        options: {
          ...options,
          routingStrategy: "delegate",
        },
        actions: [
          {
            protocol: "enso",
            action: "route",
            args: {
              tokenIn: position.token.address,
              tokenOut: targetToken.address,
              amountIn: rawAmount,
              destinationChainId: SupportedChainId.MONAD,
              refundReceiver: address,
            },
          },
        ],
      };
    } else if (isMonad) {
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
    } else {
      // Generic Same-Chain Fallback (e.g. Base -> Base)
      return {
        options,
        actions: [
          {
            protocol: "enso",
            action: "route",
            args: {
              tokenIn: position.token.address,
              tokenOut: targetToken.address,
              amountIn: rawAmount,
            },
          },
        ],
      };
    }

    return null;
  }, [position, targetToken, address, rawAmount, isCrossChain, isMonad]);

  const {
    bundleData,
    bundleLoading,
    bundleError,
    sendTransaction
  } = useEnsoBundle(bundleParams, open && !!bundleParams);

  const approve = useApproveIfNecessary(
    position?.token.address,
    rawAmount,
    bundleData?.tx?.to || ENSO_ROUTER_ADDRESS
  );

  const approveNeeded = !!approve && +rawAmount > 0 && !!position?.token.address;
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    if (pendingMigration && !approveNeeded && bundleData?.tx) {
      sendTransaction.send();
      setPendingMigration(false);
    }
  }, [pendingMigration, approveNeeded, bundleData, sendTransaction]);

  const handlePercentage = (percent: number) => {
    if (position?.balance?.amount && position?.token?.decimals) {
      const totalRaw = BigInt(position.balance.amount);
      const newRaw = totalRaw * BigInt(Math.floor(percent)) / 100n;
      setDisplayAmount(formatUnits(newRaw, position.token.decimals));
    }
  };

  const usdValue = position?.balance?.price ?
    (parseFloat(displayAmount || "0") * position.balance.price).toFixed(2) : "0.00";

  const isButtonDisabled = isDemo || (!!address && (bundleLoading || !bundleData?.tx || pendingMigration));

  // DESIGN TOKENS
  const neonGreen = "#1BD596"; // On-brand Green
  const darkBg = "#050505";
  const cardBg = "#0A0A0A";
  const borderColor = "#1A1A1A";

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-7xl"
        style={{
          width: '95vw',
          maxWidth: '1000px',
          padding: 0,
          background: 'transparent',
          boxShadow: 'none',
          border: 'none',
        }}
      >
        <Box
          bg={cardBg}
          _dark={{ bg: cardBg, borderColor: "whiteAlpha.100" }}
          borderRadius="3xl"
          overflow="hidden"
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.9)"
          position="relative"
          border="1px"
          borderColor="whiteAlpha.200"
          color="white"
        >
          {/* Ambient Lighting - Electro Green */}
          <Box position="absolute" top="-20%" right="-10%" width="500px" height="500px" bg={neonGreen} filter="blur(160px)" opacity={0.06} pointerEvents="none" />
          <Box position="absolute" bottom="-20%" left="-10%" width="500px" height="500px" bg={neonGreen} filter="blur(160px)" opacity={0.03} pointerEvents="none" />

          {/* Close Button & Header */}
          <Box p={8} pb={4} position="relative" zIndex={1}>
            <Flex justify="space-between" align="start" mb={4}>
              <Box>
                <HStack mb={2}>
                  <Badge bg="whiteAlpha.100" color={neonGreen} fontSize="xx-small" px={2} py={0.5} borderRadius="full">YIELD</Badge>
                  <Badge bg="whiteAlpha.100" color="gray.400" fontSize="xx-small" px={2} py={0.5} borderRadius="full">MIGRATION</Badge>
                </HStack>
                <DialogTitle fontSize="3xl" fontWeight="800" letterSpacing="-0.5px" fontFamily="system-ui, sans-serif">
                  Migrate Position
                </DialogTitle>
                <DialogDescription fontSize="md" color="gray.500" mt={1}>
                  Upgrade your capital efficiency to the highest yield
                </DialogDescription>
              </Box>
              <DialogCloseTrigger position="static" color="gray.400" _hover={{ color: "white" }} />
            </Flex>
          </Box>

          <Box px={8} py={2} maxH="75vh" overflowY="auto" position="relative" zIndex={1}>
            <VStack gap={8} align="stretch">

              {/* 1. HERO INPUT SECTION - DARK MODE DASHBOARD STYLE */}
              <Box>
                <Flex justify="space-between" align="baseline" mb={3}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" letterSpacing="1px" textTransform="uppercase">
                    Amount to Migrate
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Available: <Text as="span" fontWeight="bold" color={neonGreen}>{normalizeValue(position?.balance?.amount, position?.token?.decimals)} {position?.token?.symbol}</Text>
                  </Text>
                </Flex>

                <Box
                  bg="#000000"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                  p={6}
                  position="relative"
                >
                  <Flex align="center" gap={4}>
                    <Input
                      variant="flushed"
                      border="none"
                      placeholder="0.00"
                      value={displayAmount}
                      onChange={(e) => setDisplayAmount(e.target.value)}
                      fontSize="5xl"
                      fontWeight="800"
                      letterSpacing="-1px"
                      color="white"
                      _placeholder={{ color: "gray.700" }}
                      step="any"
                      type="number"
                    />
                    <VStack align="end" gap={0} flexShrink={0}>
                      <HStack gap={2} mb={1}>
                        <Text fontSize="xl" fontWeight="bold" color="gray.300">{position?.token?.symbol}</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">≈ ${usdValue}</Text>
                    </VStack>
                  </Flex>

                  {/* PERCENTAGE PILLS */}
                  <HStack gap={2} mt={4}>
                    {[25, 50, 75, 100].map((percent) => (
                      <Button
                        key={percent}
                        size="xs"
                        variant="ghost"
                        borderRadius="full"
                        color="gray.500"
                        bg="whiteAlpha.50"
                        _hover={{ bg: "whiteAlpha.200", color: neonGreen }}
                        onClick={() => handlePercentage(percent)}
                        fontSize="xs"
                        fontWeight="bold"
                        border="1px solid"
                        borderColor="transparent"
                        _active={{ bg: "whiteAlpha.300", borderColor: neonGreen }}
                      >
                        {percent === 100 ? "MAX" : `${percent}%`}
                      </Button>
                    ))}
                  </HStack>
                </Box>
              </Box>

              {/* 2. MIGRATION FLOW CARD */}
              <Box>
                <Text fontSize="xs" fontWeight="bold" color="gray.500" letterSpacing="1px" textTransform="uppercase" mb={3}>
                  Vault Comparison
                </Text>

                <Grid templateColumns={{ base: "1fr", md: "1fr auto 1fr" }} gap={4} alignItems="stretch">
                  {/* FROM CARD */}
                  <Box
                    p={5}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={borderColor}
                    bg="whiteAlpha.50"
                  >
                    <Badge bg="whiteAlpha.100" color="gray.400" fontSize="xx-small" mb={3}>CURRENT</Badge>
                    <Text fontSize="xl" fontWeight="bold" mb={1}>{position?.token?.symbol}</Text>
                    <Text fontSize="xs" color="gray.500" mb={4}>{capitalize(position?.token?.protocolSlug || "Wallet")}</Text>

                    <HStack justify="space-between" align="end">
                      <Box>
                        <Text fontSize="xs" color="gray.500">APY</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="gray.400">{sourceDisplayApy?.toFixed(2)}%</Text>
                      </Box>
                    </HStack>
                  </Box>

                  {/* ARROW INDICATOR */}
                  <Flex justify="center" direction={{ base: "row", md: "column" }} gap={2} align="center" color="gray.700">
                    <ArrowRight size={20} />
                  </Flex>

                  {/* TO CARD (Highlighted) */}
                  <Box
                    p={5}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={neonGreen}
                    bgGradient={`linear(to-br, ${neonGreen}05, transparent)`}
                    position="relative"
                    overflow="hidden"
                    boxShadow={`0 0 30px -10px ${neonGreen}20`}
                  >
                    <Box position="absolute" top={0} left={0} w="100%" h="2px" bg={neonGreen} opacity={0.5} boxShadow={`0 0 10px ${neonGreen}`} />

                    <Flex justify="space-between" align="start" mb={3}>
                      <Badge bg={neonGreen} color="black" fontSize="xx-small" fontWeight="bold">TARGET</Badge>
                      <Zap size={16} color={neonGreen} fill={neonGreen} />
                    </Flex>

                    <Text fontSize="xl" fontWeight="bold" color="white" mb={1}>{targetToken?.symbol}</Text>
                    <Text fontSize="xs" color={neonGreen} opacity={0.8} mb={4}>{capitalize(targetToken?.protocolSlug || "Vault")}</Text>

                    <HStack justify="space-between" align="end">
                      <Box>
                        <Text fontSize="xs" color="gray.400">PROJECTED APY</Text>
                        <Text fontSize="3xl" fontWeight="900" color={neonGreen} letterSpacing="-1px" textShadow={`0 0 20px ${neonGreen}40`}>
                          {targetDisplayApy ? `${targetDisplayApy.toFixed(2)}%` : "..."}
                        </Text>
                      </Box>
                      {Number(displayApyDifference) > 0 && (
                        <Badge bg="whiteAlpha.100" color={neonGreen} border={`1px solid ${neonGreen}40`}>
                          +{displayApyDifference}% boost
                        </Badge>
                      )}
                    </HStack>
                  </Box>
                </Grid>
              </Box>

              {/* 3. TRUST & INFO */}
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <HStack p={3} borderRadius="lg" bg="whiteAlpha.50" gap={3} border="1px solid" borderColor="whiteAlpha.50">
                  <Shield size={16} color={neonGreen} />
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.300">Audited</Text>
                    <Text fontSize="xs" color="gray.600">verified source</Text>
                  </Box>
                </HStack>
                <HStack p={3} borderRadius="lg" bg="whiteAlpha.50" gap={3} border="1px solid" borderColor="whiteAlpha.50">
                  <Lock size={16} color={neonGreen} />
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.300">Non-Custodial</Text>
                    <Text fontSize="xs" color="gray.600">funds stay yours</Text>
                  </Box>
                </HStack>
                <HStack p={3} borderRadius="lg" bg="whiteAlpha.50" gap={3} border="1px solid" borderColor="whiteAlpha.50">
                  <Activity size={16} color={neonGreen} />
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.300">Route</Text>
                    <Text fontSize="xs" color="gray.600">{isCrossChain ? "Cross-chain" : "Single-chain"}</Text>
                  </Box>
                </HStack>
              </SimpleGrid>

              {/* ERROR BOX */}
              {bundleError && (
                <Box bg="red.900" p={4} borderRadius="xl" border="1px solid" borderColor="red.500">
                  <Text fontSize="sm" fontWeight="bold" color="red.200" mb={1}>Transaction Error</Text>
                  <Text fontSize="xs" color="red.300" fontFamily="monospace">{String(bundleError)}</Text>
                </Box>
              )}

            </VStack>
          </Box>

          {/* FOOTER ACTION */}
          <Box p={8} pt={4} bg="transparent" position="relative" zIndex={2}>
            {!isDemo ? (
              <Button
                w="100%"
                size="xl"
                h="64px"
                bg={neonGreen}
                color="black"
                _hover={{ bg: "#00CC7D", transform: "translateY(-1px)", boxShadow: `0 0 30px ${neonGreen}40` }}
                _active={{ transform: "translateY(0)" }}
                _disabled={{
                  bg: "gray.800",
                  color: "gray.500",
                  cursor: "not-allowed",
                  boxShadow: "none",
                  opacity: 1,
                  border: "1px solid",
                  borderColor: "whiteAlpha.100"
                }}
                fontSize="lg"
                fontWeight="800"
                borderRadius="xl"
                transition="all 0.2s"
                disabled={isButtonDisabled}
                letterSpacing="0.5px"
                onClick={() => {
                  if (!address && openConnectModal) {
                    openConnectModal();
                    return;
                  }
                  if (approveNeeded) {
                    approve?.write();
                    setPendingMigration(true);
                  } else {
                    sendTransaction.send();
                  }
                }}
              >
                {(() => {
                  if (!address) return <HStack><Wallet size={20} /> <Text>Connect Wallet</Text></HStack>;
                  if (bundleLoading) return <HStack><Activity className="animate-spin" /> <Text>CALCULATING ROUTE...</Text></HStack>;
                  if (approveNeeded) return <HStack><Lock size={20} /> <Text>APPROVE ACCESS</Text></HStack>;
                  if (sendTransaction.isLoading) return <HStack><Activity className="animate-spin" /> <Text>PROCESSING...</Text></HStack>;
                  return <HStack><Wallet size={20} /> <Text>CONFIRM MIGRATION</Text></HStack>;
                })()}
              </Button>
            ) : (
              <Button w="100%" size="lg" disabled variant="outline">DEMO MODE</Button>
            )}
            {isCrossChain && (
              <Text textAlign="center" mt={4} fontSize="xs" color="gray.600" fontFamily="monospace">
                ESTIMATED TIME: 4-8 MINUTES • POWERED BY ENSO
              </Text>
            )}

            {/* DEBUG INFO - DISCREET */}
            <Box mt={6} pt={4} borderTop="1px dashed" borderColor="whiteAlpha.100">
              <Text fontSize="xx-small" color="gray.800" fontFamily="monospace">
                DEBUG: BUNDLE={bundleData?.tx ? "OK" : "NO"} | LOADING={bundleLoading ? "YES" : "NO"} | PARAMS={bundleParams ? "OK" : "NULL"}
                {bundleError && ` | ERROR=${String(bundleError).substring(0, 30)}...`}
              </Text>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </DialogRoot>
  );
};

export default ConfirmDialog;
