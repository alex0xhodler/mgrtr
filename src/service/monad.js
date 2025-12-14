import { useMemo } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { ENSO_ROUTER_ADDRESS, MONAD_USDC_ADDRESS, SupportedChainId } from "./constants";
import { toaster } from "@/components/ui/toaster";
import { useEnsoBundle } from "./enso";
// Minimal ABIs
const VAULT_ABI = [
    {
        inputs: [
            { name: "shares", type: "uint256" },
            { name: "receiver", type: "address" },
            { name: "owner", type: "address" },
        ],
        name: "redeem",
        outputs: [{ name: "assets", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { name: "assets", type: "uint256" },
            { name: "receiver", type: "address" },
        ],
        name: "deposit",
        outputs: [{ name: "shares", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },
];
export const useMonadMigration = (sourceTokenAddress, targetTokenAddress, amount, decimals = 6) => {
    const { address } = useAccount();
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const publicClient = usePublicClient();
    // Prepare Bundle Params
    const bundleParams = useMemo(() => {
        if (!address || !sourceTokenAddress || !targetTokenAddress || !amount || +amount === 0)
            return null;
        const amountBN = BigInt(amount); // Amount is already in shares (raw value)
        // Action 0: Redeem from Source (Gearbox) -> Receiver: Enso Router
        // Note: User must approve Enso Router to spend/burn Source Shares beforehand.
        const redeemTuple = [
            sourceTokenAddress, // vault
            { useOutputOfCallAt: -1 }, // N/A, static amount? No, static amount shares.
            // Wait, "args" for enso:call expects array.
            // redeem(shares, receiver, owner)
            amountBN.toString(), // shares
            ENSO_ROUTER_ADDRESS, // receiver (Router needs funds to approve next step)
            address // owner (User)
        ];
        // Action 1: Approve Target to spend USDC (from Router)
        // Router calls: USDC.approve(Target, amount)
        // Amount is output of Action 0 (assets redeemed)?
        // Problem: Action 0 returns "assets" (uint256).
        // Yes, we can use { useOutputOfCallAt: 0 } for amount.
        // Action 2: Deposit to Target (from Router) -> Receiver: User
        // Router calls: Target.deposit(assets, receiver)
        // Assets: { useOutputOfCallAt: 0 } (same as approve amount, or output of redeem)
        // Receiver: address (User)
        const actions = [
            {
                protocol: "enso",
                action: "call",
                args: {
                    address: sourceTokenAddress,
                    method: "redeem",
                    abi: "function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets)",
                    args: [
                        amountBN.toString(),
                        ENSO_ROUTER_ADDRESS,
                        address
                    ]
                }
            },
            {
                protocol: "erc20",
                action: "approve",
                args: {
                    token: MONAD_USDC_ADDRESS,
                    spender: targetTokenAddress,
                    amount: { useOutputOfCallAt: 0 } // Result of redeem is assets
                }
            },
            {
                protocol: "enso",
                action: "call",
                args: {
                    address: targetTokenAddress,
                    method: "deposit",
                    abi: "function deposit(uint256 assets, address receiver) external returns (uint256 shares)",
                    args: [
                        { useOutputOfCallAt: 0 }, // Assets from redeem
                        address // Receiver is User
                    ]
                }
            }
        ];
        return {
            options: {
                chainId: SupportedChainId.MONAD,
                fromAddress: address,
                receiver: address,
                routingStrategy: "router", // Router executes the bundle
            },
            actions
        };
    }, [address, sourceTokenAddress, targetTokenAddress, amount, decimals]); // Decimals unused but kept for hook signature
    const { sendTransaction, bundleLoading, bundleError, bundleData } = useEnsoBundle(bundleParams, true // active
    );
    const migrate = () => {
        if (bundleError) {
            toaster.create({
                title: "Bundle Error",
                description: "Failed to generate migration bundle.",
                type: "error"
            });
            return;
        }
        if (!bundleData?.tx || !sendTransaction.send) {
            toaster.create({
                title: "Not Ready",
                description: "Migration data is being prepared...",
                type: "info"
            });
            return;
        }
        sendTransaction.send();
    };
    const status = bundleLoading ? "loading" :
        sendTransaction.isLoading ? "confirming" :
            sendTransaction.data ? "success" : "idle";
    return {
        migrate,
        status,
        txHash: sendTransaction.data,
        isReady: !!bundleData?.tx
    };
};
