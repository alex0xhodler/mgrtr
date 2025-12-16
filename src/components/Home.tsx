import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Box,
  Heading,
  Text,
  HStack,
  useDisclosure,
  Card,
  Center,
  Skeleton,
  Flex,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Address, isAddress } from "viem";
import { useAccount, useChainId } from "wagmi";
import { TokenData } from "@ensofinance/sdk";
import { useEnsoBalances, useEnsoTokenDetails } from "@/service/enso";
import { useErc20Balance } from "@/service/wallet"; // Added manual fetch
import { formatNumber, formatUSD, normalizeValue } from "@/service";
import { capitalize, useDefiLlamaAPY } from "@/service/common";
import { DEFILLAMA_POOL_IDS, MOCK_POSITIONS, MONAD_TARGETS, MONAD_VAULTS, SupportedChainId, MONAD_USDC_ADDRESS } from "@/service/constants";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Toaster } from "@/components/ui/toaster";
import { Position } from "@/types";

const SourcePoolItem = ({
  position,
  isSelected,
  onClick,
}: {
  position: Position;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const normalizedBalance = normalizeValue(
    position.balance.amount,
    position.token.decimals,
  );

  // Fetch Real APY for Gearbox on Monad
  const poolId = position.token.chainId === SupportedChainId.MONAD &&
    position.token.address.toLowerCase() === MONAD_VAULTS.GEARBOX_USDC.toLowerCase()
    ? DEFILLAMA_POOL_IDS.GEARBOX_USDC : null;

  const { data: apyData } = useDefiLlamaAPY(poolId || "");
  const displayApy = poolId && apyData ? apyData.apy : position.token.apy;
  const displayTvl = poolId && apyData ? apyData.borrowed : position.token.tvl;

  return (
    <Box
      p={{ base: 3, md: 4 }}
      bg="#111111"
      rounded="xl"
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ transform: "translateY(-2px)", shadow: "0 0 20px rgba(27, 213, 150, 0.15)" }}
      border={"1px solid"}
      borderColor={isSelected ? "#1BD596" : "#222"}
      onClick={onClick}
      width="100%"
      position="relative"
      overflow="hidden"
    >
      {isSelected && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="radial-gradient(circle at center, rgba(27, 213, 150, 0.05) 0%, transparent 70%)"
          pointerEvents="none"
        />
      )}
      <HStack
        justify="space-between"
        align="start"
        flexWrap={{ base: "wrap", sm: "nowrap" }}
      >
        <Box flex="1" minW={{ base: "60%", sm: "auto" }}>
          <HStack gap={2} mb={1}>
            <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color="white">
              {position.token.name}
            </Text>
            {isSelected && <Box w="6px" h="6px" rounded="full" bg="#1BD596" boxShadow="0 0 10px #1BD596" />}
          </HStack>

          <Text fontSize="xs" color={"gray.400"} letterSpacing="0.5px">
            {capitalize(position.token.project ?? "")}
          </Text>

          <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500" mt={2} fontFamily="monospace">
            {position.token.underlyingTokens
              ?.map(({ symbol }) => symbol)
              .join(" / ")}
          </Text>

          {displayTvl > 0 && (
            <Text mt={1} fontSize="xs" color="gray.600">
              TVL: ${formatNumber(displayTvl)}
            </Text>
          )}
        </Box>

        <Box textAlign="right">
          <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }} color="white">
            {formatUSD(+normalizedBalance * +position.balance.price)}
          </Text>

          <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500" mb={1}>
            {formatNumber(normalizedBalance)} {position.token.symbol}
          </Text>

          {(displayApy > 0 || displayApy === 0) && (
            <Text fontSize={{ base: "sm", md: "md" }} color="#1BD596" fontWeight="bold">
              {displayApy?.toFixed(2)}% APY
            </Text>
          )}
        </Box>
      </HStack>
    </Box>
  );
};

const TargetPoolItem = ({
  token,
  sourceApy,
  onSelect,
}: {
  token: TokenData & { project?: string };
  sourceApy: number;
  onSelect: () => void;
}) => {
  // Determine Pool ID for APY Fetch
  let poolId = null;
  if (token.chainId === SupportedChainId.MONAD) {
    if (token.address.toLowerCase() === MONAD_VAULTS.USDC_ASIA.toLowerCase()) poolId = DEFILLAMA_POOL_IDS.USDC_ASIA;
    if (token.address.toLowerCase() === MONAD_VAULTS.USDC_DELTA.toLowerCase()) poolId = DEFILLAMA_POOL_IDS.USDC_DELTA;
  }

  const { data: apyData } = useDefiLlamaAPY(poolId || "");
  const displayApy = poolId && apyData ? apyData.apy : token.apy;
  // Fallback to totalBorrowedUsd or tvlUsd
  const displayTvl = poolId && apyData ? (apyData.totalBorrowedUsd || apyData.tvlUsd) : token.tvl;

  const apyDiff = displayApy - sourceApy;
  const isPositive = apyDiff > 0;

  return (
    <Box
      p={{ base: 3, md: 4 }}
      bg="#111111"
      rounded="xl"
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ transform: "translateY(-2px)", shadow: "0 0 20px rgba(27, 213, 150, 0.1)" }}
      border={"1px solid #222"}
      onClick={onSelect}
      width="100%"
      position="relative"
    >
      <HStack
        justify="space-between"
        align="start"
        flexWrap={{ base: "wrap", sm: "nowrap" }}
      >
        <Box flex="1" minW={{ base: "60%", sm: "auto" }}>
          <HStack gap={2} mb={1}>
            <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color="white">
              {token.name}
            </Text>
          </HStack>

          <Text fontSize="xs" color={"gray.400"}>
            {capitalize(token.project)}
          </Text>{" "}
          {poolId && (
            <Text mt={1} fontSize="xs" color="gray.600">
              Instant Liquidity: {displayTvl ? formatUSD(displayTvl) : "Loading..."}
            </Text>
          )}
        </Box>

        {(displayApy > 0 || displayApy === 0) && (
          <Box textAlign="right">
            <Box display="flex" justifyContent="flex-end" mb={1}>
              <Box px={2} py={0.5} bg="#1BD59630" rounded="md">
                <Text fontSize="10px" color="#1BD596" fontWeight="bold">ACTIVE</Text>
              </Box>
            </Box>
            <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="#1BD596">
              {displayApy?.toFixed(2)}% APY
            </Text>
            <HStack
              justify="end"
              gap={1}
              fontSize={{ base: "xs", md: "sm" }}
              color={isPositive ? "#1BD596" : "red.400"}
            >
              {isPositive ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              {sourceApy > 0 && (displayApy > 0 || displayApy === 0) && (
                <Text color={isPositive ? "#1BD596" : "red.400"} opacity={0.8}>
                  {isPositive ? "+" : ""}
                  {apyDiff.toFixed(2)}%
                </Text>
              )}
            </HStack>
          </Box>
        )}
      </HStack>
    </Box>
  );
};

const RenderSkeletons = () => {
  const skeletonWidth = useBreakpointValue({ base: "100%", md: "430px" });

  return [1, 2, 3].map((_, i) => (
    <Skeleton rounded="xl" key={i} h={"110px"} w={skeletonWidth} />
  ));
};

const usePositions = (currentChainId: number) => {
  const { data: balances, isLoading: balancesLoading } = useEnsoBalances();

  // MANUAL FETCH: Force check Euler vault in case Enso indexer is behind
  const { data: eulerBalance } = useErc20Balance(MONAD_VAULTS.EULER_USDC as Address);

  // Merge manual balances
  const mergedBalances = [...(balances || [])];
  if (eulerBalance && eulerBalance > 0n) {
    const eulerAddr = MONAD_VAULTS.EULER_USDC.toLowerCase();
    const exists = mergedBalances.find(b => b.token.toLowerCase() === eulerAddr);
    if (!exists) {
      console.log("DEBUG: Injecting manual Euler balance", eulerBalance.toString());
      mergedBalances.push({
        token: MONAD_VAULTS.EULER_USDC,
        amount: eulerBalance.toString(),
        decimals: 6, // Assume 6 for USDC vaults (safe bet, usually matches underlying)
        price: 1, // Assume $1 peg for now if missing
        symbol: "eUSDC",
        name: "Euler USDC",
        chainId: SupportedChainId.MONAD,
        project: "Euler",
      } as any);
    }
  }

  const sortedBalances = mergedBalances
    ?.slice()
    .sort(
      (a, b) =>
        +normalizeValue(+b.amount, b.decimals) * +b.price -
        +normalizeValue(+a.amount, a.decimals) * +a.price,
    );
  const notEmptyBalanceAddresses = sortedBalances
    ?.filter(({ token }) => isAddress(token))
    .map((position) => position.token);

  console.log("DEBUG: notEmptyBalanceAddresses", notEmptyBalanceAddresses);
  if (sortedBalances && sortedBalances.length > 0) {
    // console.log("DEBUG: first balance item", sortedBalances[0]);
    // Debug logging...
  }

  const { data: positionsTokens, isLoading: tokenLoading } =
    useEnsoTokenDetails({
      address: notEmptyBalanceAddresses,
      type: undefined,
    });

  // ... rest of hook

  const positions = sortedBalances
    ?.map((balance) => {
      let token = positionsTokens?.find(
        (token) => token.address.toLowerCase() === balance.token.toLowerCase(),
      );

      // Force metadata for manual Euler if missing
      if (!token && balance.token.toLowerCase() === MONAD_VAULTS.EULER_USDC.toLowerCase()) {
        token = {
          address: balance.token as Address,
          name: "Euler USDC",
          symbol: "eUSDC",
          decimals: 6,
          logoURI: "",
          project: "Euler",
          chainId: SupportedChainId.MONAD,
          underlyingTokens: [],
          apy: 0,
          tvl: 0,
        } as any;
      }

      if (!token) {
        // Fallback using balance data if Enso token details are missing
        token = {
          address: balance.token as Address,
          name: balance.name || "Unknown Token",
          symbol: balance.symbol || "UNK",
          decimals: balance.decimals,
          logoURI: balance.logoUri || "",
          underlyingTokens: [],
          apy: 0,
          tvl: 0,
          project: balance.token.toLowerCase() === MONAD_VAULTS.GEARBOX_USDC.toLowerCase()
            ? "Gearbox"
            : balance.token.toLowerCase() === MONAD_VAULTS.MORPHO_USDC.toLowerCase()
              ? "Morpho"
              : balance.token.toLowerCase() === MONAD_VAULTS.EULER_USDC?.toLowerCase()
                ? "Euler"
                : "Unknown",
          chainId: (balance as any).chainId || currentChainId, // Default to current chain if missing
        } as any; // Cast to TokenData structure
      }

      return { balance, token };
    })
    .filter(({ token, balance }) => {
      // logic...
      if (token.chainId !== SupportedChainId.MONAD) return false;
      const addr = token.address.toLowerCase();
      const isMonadVault =
        addr === MONAD_VAULTS.GEARBOX_USDC.toLowerCase() ||
        addr === MONAD_VAULTS.MORPHO_USDC.toLowerCase() ||
        addr === MONAD_VAULTS.EULER_USDC?.toLowerCase() ||
        addr === MONAD_USDC_ADDRESS.toLowerCase();

      if (!isMonadVault) return false;
      return true;
    });

  const positionsLoading = balancesLoading || tokenLoading;

  return {
    positions,
    positionsLoading,
  };
};

const useTargetTokens = (
  underlyingTokensExact: Address[],
  currentTokenName: string,
  chainId?: number,
) => {
  const { data: underlyingTokensData, isLoading: targetLoading } =
    useEnsoTokenDetails({
      underlyingTokensExact,
      chainId,
    });

  /* eslint-disable-next-line prefer-const */
  let { filteredUnderlyingTokens, targetLoading: loading } = {
    filteredUnderlyingTokens: underlyingTokensData
      ?.filter((token) => token.name !== currentTokenName && Number(token.apy) > 0), targetLoading
  };

  // Note: We return the raw data here, sorting happens in component to include Monad targets
  return { filteredUnderlyingTokens, targetLoading };
};

const Home = () => {
  const [selectedSource, setSelectedSource] = useState<Position>();
  const [selectedTarget, setSelectedTarget] = useState<TokenData>();
  const isDemo = false;
  const { open, onOpen, onClose } = useDisclosure();
  const { address } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    // setSelectedSource(undefined); // Create persistence for cross-chain flow
  }, [chainId, address, isDemo]);

  const { positions, positionsLoading } = usePositions(chainId);

  const underlyingTokens = selectedSource?.token.underlyingTokens?.map(
    ({ address }) => address,
  ) ?? [];

  /* eslint-disable-next-line prefer-const */
  let { filteredUnderlyingTokens: ensoTokens, targetLoading } = useTargetTokens(
    underlyingTokens,
    selectedSource?.token.name,
    isDemo ? 8453 : chainId,
  );

  // Show only Monad Accountable targets
  // Filter Logic:
  // 1. sUSN (Delta Neutral) - Always shown if source > $100 (implied by source filter)
  // 2. sbMU (Asia Credit) - Only shown if source > $500
  let filteredUnderlyingTokens = MONAD_TARGETS as any[];

  if (selectedSource) {
    const sourceVal = +normalizeValue(selectedSource.balance.amount, selectedSource.token.decimals) * +selectedSource.balance.price;
    console.log("DEBUG: Source Value", sourceVal);

    filteredUnderlyingTokens = filteredUnderlyingTokens.filter(target => {
      // const isAsia = target.address.toLowerCase() === MONAD_VAULTS.USDC_ASIA.toLowerCase();
      // if (isAsia && sourceVal < 500) return false;
      return true;
    });
  }

  const positionsToUse = isDemo ? MOCK_POSITIONS : positions;

  const handleTargetSelect = (target) => {
    setSelectedTarget(target);
    onOpen();
  };

  // Determine if we're on mobile
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Box minH="100vh">
      <Toaster />

      <Center>
        <Box
          mx="auto"
          w="full"
          maxW="7xl"
          px={{ base: 2, md: 4 }}
          py={{ base: 4, md: 8 }}
        >
          <Flex
            align="center"
            justifyContent="space-around"
            direction={{ base: "column", sm: "row" }}
            gap={{ base: 3, md: 5 }}
            mb={{ base: 3, md: 5 }}
            w="full"
          >
            <Box>
              <Heading
                display="flex"
                alignItems="center"
                gap={2}
                fontSize={{ base: "xl", md: "2xl" }}
                fontWeight="bold"
              >
                <ArrowRightLeft className="h-6 w-6" />
                Accountable Yield Migrator
              </Heading>
            </Box>

          </Flex>

          <Flex
            justifyContent="center"
            direction={{ base: "column", md: "row" }}
            gap={{ base: 4, md: 6 }}
            w="full"
            align="start"
          >
            {/* Source Pool Column */}
            <Box w={{ base: "full", md: "480px" }} mb={{ base: 4, md: 0 }}>
              <Card.Root>
                <Card.Header>
                  <Heading size="md">Your positions</Heading>
                </Card.Header>

                <Card.Body gap={4}>
                  {positionsLoading ? (
                    <RenderSkeletons />
                  ) : positionsToUse?.length > 0 ? (
                    positionsToUse.map((position) => (
                      <SourcePoolItem
                        key={position.token.address}
                        position={position}
                        isSelected={
                          selectedSource?.token.address ===
                          position.token.address
                        }
                        onClick={() => setSelectedSource(position)}
                      />
                    ))
                  ) : (
                    <Box
                      display="flex"
                      flexDirection="column"
                      minH="40"
                      alignItems="center"
                      justifyContent="center"
                      color="gray.500"
                      textAlign="center"
                      p={4}
                      gap={2}
                    >
                      {address ? (
                        <>
                          <Text fontWeight="bold">No eligible positions found</Text>
                          <Text fontSize="xs" color="gray.400">
                            We only support <Text as="span" color="white">Gearbox</Text>, <Text as="span" color="white">Morpho</Text> or <Text as="span" color="white">Euler</Text> vaults,
                            or <Text as="span" color="white">USDC</Text> holdings on Monad.
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Minimum value required: <b>$100</b>
                          </Text>
                        </>
                      ) : (
                        <Text textAlign="center" px={2}>
                          Connect your wallet to continue
                        </Text>
                      )}
                    </Box>
                  )}
                </Card.Body>
              </Card.Root>
            </Box>

            {/* Mobile arrow indicator */}
            {isMobile && selectedSource && (
              <Flex justify="center" w="full" py={2}>
                <ArrowRight className="h-6 w-6" />
              </Flex>
            )}

            {/* Target Pool Column */}
            <Box w={{ base: "full", md: "480px" }}>
              <Card.Root>
                <Card.Header>
                  <Heading size="md">Target Pool</Heading>
                </Card.Header>

                <Card.Body gap={4}>
                  {selectedSource ? (
                    targetLoading ? (
                      <RenderSkeletons />
                    ) : (
                      filteredUnderlyingTokens?.map((target) => (
                        <TargetPoolItem
                          key={target.address}
                          token={target}
                          sourceApy={Number(selectedSource?.token.apy || 0)}
                          onSelect={() => handleTargetSelect(target)}
                        />
                      ))
                    )
                  ) : (
                    <Box
                      display="flex"
                      h="40"
                      alignItems="center"
                      justifyContent="center"
                      color="gray.500"
                    >
                      <HStack alignItems="center" gap={2}>
                        <Text>Select a source pool</Text>
                        <ArrowRight className="h-4 w-4" />
                      </HStack>
                    </Box>
                  )}
                </Card.Body>
              </Card.Root>
            </Box>
          </Flex>
        </Box>
      </Center>

      <ConfirmDialog
        open={open}
        onOpenChange={onClose}
        position={selectedSource}
        targetToken={selectedTarget}
        isDemo={isDemo}
      />
    </Box>
  );
};

export default Home;
