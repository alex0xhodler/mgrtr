import { Token } from "./common";

export const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
export const ETH_TOKEN: Token = {
  address: ETH_ADDRESS,
  name: "Ethereum",
  symbol: "ETH",
  decimals: 18,
  logoURI:
    "https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880",
};

export enum SupportedChainId {
  MAINNET = 1,
  ARBITRUM_ONE = 42161,
  OPTIMISM = 10,
  POLYGON = 137,
  BSC = 56,
  // BOBA = 288,
  BASE = 8453,
  // BLAST = 81457,
  // SCROLL = 534352,
  LINEA = 59144,
  ZKSYNC = 324,
  GNOSIS = 100,
  AVALANCHE = 43114,
  MONAD = 143,
  // ARBITRUM_RINKEBY = 421611,
  // OPTIMISM_GOERLI = 420,w
  // GOERLI = 5,
  // POLYGON_MUMBAI = 80001,
  // CELO = 42220,
  // CELO_ALFAJORES = 44787,
}

export const GECKO_CHAIN_NAMES: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: "ethereum",
  [SupportedChainId.ARBITRUM_ONE]: "arbitrum-one",
  [SupportedChainId.OPTIMISM]: "optimistic-ethereum",
  [SupportedChainId.POLYGON]: "polygon-pos",
  // [SupportedChainId.BOBA]: "boba",
  [SupportedChainId.BASE]: "base",
  [SupportedChainId.BSC]: "binance-smart-chain",
  // [SupportedChainId.BLAST]: "blast",
  // [SupportedChainId.SCROLL]: "scroll",
  [SupportedChainId.LINEA]: "linea",
  [SupportedChainId.ZKSYNC]: "zksync",
  [SupportedChainId.GNOSIS]: "xdai",
  [SupportedChainId.AVALANCHE]: "avalanche",
  [SupportedChainId.MONAD]: "monad",
};

export const MOCK_IMAGE_URL =
  "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png";

export const CHAINS_ETHERSCAN: Record<SupportedChainId, string> = {
  [SupportedChainId.OPTIMISM]: "https://optimistic.etherscan.io",
  [SupportedChainId.MAINNET]: "https://etherscan.io",
  [SupportedChainId.ARBITRUM_ONE]: "https://arbiscan.io",
  [SupportedChainId.POLYGON]: "https://polygonscan.com",
  [SupportedChainId.BSC]: "https://bscscan.com",
  // [SupportedChainId.BOBA]: "https://bobascan.com",
  [SupportedChainId.BASE]: "https://basescan.org",
  // [SupportedChainId.BLAST]: "https://blastscan.io",
  // [SupportedChainId.SCROLL]: "https://scrollscan.com",
  [SupportedChainId.LINEA]: "https://lineascan.build",
  [SupportedChainId.ZKSYNC]: "https://explorer.zksync.io/",
  [SupportedChainId.GNOSIS]: "https://gnosisscan.io/",
  [SupportedChainId.AVALANCHE]: "https://cchain.explorer.avax.network",
  [SupportedChainId.MONAD]: "https://monadexplorer.com", // Placeholder
};

export const MONAD_VAULTS = {
  USDC_ASIA: "0x4C0d041889281531fF060290d71091401Caa786D",
  USDC_DELTA: "0x58ba69b289De313E66A13B7D1F822Fc98b970554",
  GEARBOX_USDC: "0x6b343f7b797f1488aa48c49d540690f2b2c89751",
  MORPHO_USDC: "0xbeEFf443C3CbA3E369DA795002243BeaC311aB83",
  EULER_USDC: "0xA981f053C118FE4dB0e1aEBA192AAD20Ec7F7801",
} as const;

export const MONAD_USDC_ADDRESS = "0x754704Bc059F8C67012fEd69BC8A327a5aafb603";
export const ENSO_ROUTER_ADDRESS = "0xCfBAa9Cfce952Ca4F4069874fF1Df8c05e37a3c7";

export const DEFILLAMA_POOL_IDS = {
  GEARBOX_USDC: "f616e271-82c4-4e5d-9eae-faa32dc182ec",
  USDC_ASIA: "7a268579-3a0d-424c-be50-cc0b51f88feb",
  USDC_DELTA: "b31b6aed-26d7-48dd-b23c-43b5048ff1f5",
} as const;

export const MONAD_TARGETS = [
  {
    address: MONAD_VAULTS.USDC_ASIA,
    name: "Asia Credit Yield",
    symbol: "sbMU",
    decimals: 6,
    chainId: SupportedChainId.MONAD,
    logoURI: "",
    apy: 12.5, // Mock APY or dynamic if possible
    tvl: 0,
    underlyingTokens: [
      {
        address: MONAD_USDC_ADDRESS,
        symbol: "USDC",
        name: "USDC",
        decimals: 6,
        chainId: SupportedChainId.MONAD,
        logosUri: ["https://assets.coingecko.com/coins/images/6319/thumb/usdc.png?1696560694"],
        type: "base",
      },
    ],
    project: "Accountable",
  },
  {
    address: MONAD_VAULTS.USDC_DELTA,
    name: "sUSN Delta Neutral",
    symbol: "naccUSDC",
    decimals: 6,
    chainId: SupportedChainId.MONAD,
    logoURI: "",
    apy: 15.2, // Mock APY
    tvl: 0,
    underlyingTokens: [
      {
        address: MONAD_USDC_ADDRESS,
        symbol: "USDC",
        name: "USDC",
        decimals: 6,
        chainId: SupportedChainId.MONAD,
        logosUri: ["https://assets.coingecko.com/coins/images/6319/thumb/usdc.png?1696560694"],
        type: "base",
      },
    ],
    project: "Accountable",
  },
];


export const NATIVE_ETH_CHAINS = [
  SupportedChainId.MAINNET,
  SupportedChainId.ARBITRUM_ONE,
  SupportedChainId.OPTIMISM,
  SupportedChainId.BASE,
  SupportedChainId.LINEA,
  SupportedChainId.ZKSYNC,
];

export const ONEINCH_ONLY_TOKENS = [
  "0xcf21354360fdae8edad02c0529e55cb3e71c36c9",
  "0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3",
];

export const PRICE_IMPACT_WARN_THRESHOLD = 100; // basis points
export const DEFAULT_SLIPPAGE = 25; // 0.25%



export const MOCK_POSITIONS = [
  {
    balance: {
      amount: "300025930",
      decimals: 6,
      price: 1,
    },
    token: {
      address: "0x4e65fe4dba92790696d040ac24aa414708f5c0ab",
      chainId: 8453,
      decimals: 6,
      apy: 4.22851,
      logosUri: [],
      name: "Aave Base USDC",
      primaryAddress: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
      protocolSlug: "aave-v3",
      symbol: "aBasUSDC",
      type: "defi",
      underlyingTokens: [
        {
          address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          chainId: 8453,
          decimals: 6,
          logosUri: [
            "https://assets.coingecko.com/coins/images/6319/thumb/usdc.png?1696560694",
          ],
          name: "USDC",
          symbol: "USDC",
          type: "base",
        },
      ],
    },
  },
  {
    balance: {
      amount: "2563564008936685",
      decimals: 18,
      price: 116371.0765373658,
    },
    token: {
      address: "0x543257ef2161176d7c8cd90ba65c2d4caef5a796",
      chainId: 8453,
      decimals: 18,
      apy: null,
      logosUri: [
        "https://assets.coingecko.com/coins/images/40143/thumb/cbbtc.webp?1726136727",
      ],
      name: "Moonwell Frontier cBTC",
      primaryAddress: "0x543257ef2161176d7c8cd90ba65c2d4caef5a796",
      protocolSlug: "morpho-blue-vaults",
      symbol: "mwCBTC",
      type: "defi",
      underlyingTokens: [
        {
          address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
          chainId: 8453,
          decimals: 18,
          logosUri: [
            "https://assets.coingecko.com/coins/images/40143/thumb/cbbtc.webp?1726136727",
          ],
          name: "Coinbase Wrapped BTC",
          symbol: "cBBTC",
          type: "base",
        },
      ],
    },
  },
  {
    balance: {
      amount: "58472431770130",
      decimals: 18,
      price: 3525958.418723757,
    },
    token: {
      address: "0x950847d1dd451b67a2fc1795c0c9a53cf88e63a2",
      chainId: 8453,
      decimals: 18,
      apy: null,
      logosUri: [],
      name: "Uniswap V2",
      primaryAddress: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
      protocolSlug: "uniswap-v2",
      symbol: "UNI-V2",
      type: "defi",
      underlyingTokens: [
        {
          address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
          chainId: 8453,
          decimals: 18,
          logosUri: [
            "https://assets.coingecko.com/coins/images/39807/thumb/dai.png?1724126571",
          ],
          name: "L2 Standard Bridged DAI  Base ",
          symbol: "DAI",
          type: "base",
        },
        {
          address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          chainId: 8453,
          decimals: 6,
          logosUri: [
            "https://assets.coingecko.com/coins/images/6319/thumb/usdc.png?1696560694",
          ],
          name: "USDC",
          symbol: "USDC",
          type: "base",
        },
      ],
    },
  },
  {
    balance: {
      amount: "934323014800",
      decimals: 18,
      price: 174168492.693748,
    },
    token: {
      address: "0x88a43bbdf9d098eec7bceda4e2494615dfd9bb9c",
      chainId: 8453,
      decimals: 18,
      apy: 20.88049,
      logosUri: [],
      name: "Uniswap V2",
      primaryAddress: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
      protocolSlug: "uniswap-v2",
      symbol: "UNI-V2",
      type: "defi",
      underlyingTokens: [
        {
          address: "0x4200000000000000000000000000000000000006",
          chainId: 8453,
          decimals: 18,
          logosUri: [
            "https://assets.coingecko.com/coins/images/39810/thumb/weth.png?1724139790",
          ],
          name: "L2 Standard Bridged WETH  Base ",
          symbol: "WETH",
          type: "base",
        },
        {
          address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          chainId: 8453,
          decimals: 6,
          logosUri: [
            "https://assets.coingecko.com/coins/images/6319/thumb/usdc.png?1696560694",
          ],
          name: "USDC",
          symbol: "USDC",
          type: "base",
        },
      ],
    },
  },
  {
    balance: {
      amount: "96995500",
      decimals: 5,
      price: 1.652376441901957,
    },
    token: {
      address: "0xf42f5795d9ac7e9d757db633d693cd548cfd9169",
      chainId: 8453,
      decimals: 6,
      apy: 18.81,
      logosUri: [],
      name: "Fluid USDCoin",
      primaryAddress: "0xf42f5795d9ac7e9d757db633d693cd548cfd9169",
      protocolSlug: "fluid",
      symbol: "fUSDC",
      type: "defi",
      underlyingTokens: [
        {
          address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          chainId: 8453,
          decimals: 6,
          logosUri: [
            "https://assets.coingecko.com/coins/images/6319/thumb/usdc.png?1696560694",
          ],
          name: "USDC",
          symbol: "USDC",
          type: "base",
        },
      ],
    },
  },
  {
    balance: {
      amount: "677961709847220000",
      decimals: 18,
      price: 118.04164640603918,
      token: "0x21594b992f68495dd28d605834b58889d0a727c7",
    },
    token: {
      address: "0x21594b992f68495dd28d605834b58889d0a727c7",
      apy: 70.55373,
      chainId: 8453,
      decimals: 18,
      logosUri: [],
      name: "Volatile AMM - VIRTUAL/WETH",
      primaryAddress: "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43",
      protocolSlug: "aerodrome",
      symbol: "vAMM-VIRTUAL/WETH",
      type: "defi",
      underlyingTokens: [
        {
          address: "0x4200000000000000000000000000000000000006",
          chainId: 8453,
          decimals: 18,
          logosUri: [
            "http:/assets.coingecko.com/coins/images/39810/thumb/weth.png?1724139790",
          ],
          name: "L2 Standard Bridged WETH  Base ",
          symbol: "WETH",
          type: "defi",
        },
        {
          address: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b",
          chainId: 8453,
          decimals: 18,
          logosUri: [
            "http:/assets.coingecko.com/coins/images/34057/thumb/LOGOMARK.png?1708356054",
          ],
          name: "Virtuals Protocol",
          symbol: "VIRTUAL",
          type: "base",
        },
      ],
    },
  },
];
