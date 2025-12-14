import { useCallback, useEffect, useState } from "react";
import { useAccount, useBalance, useChainId, useReadContract, useSendTransaction, useWaitForTransactionReceipt, useWriteContract, } from "wagmi";
import { erc20Abi } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { toaster } from "@/components/ui/toaster";
import { ETH_ADDRESS } from "./constants";
import { useEnsoToken } from "./enso";
import { formatNumber, normalizeValue } from "./index";
const useInterval = (callback, interval) => {
    const savedCallback = useCallback(callback, []);
    useEffect(() => {
        const id = setInterval(savedCallback, interval);
        return () => clearInterval(id);
    }, [interval, savedCallback]);
};
const useChangingIndex = () => {
    const [index, setIndex] = useState(0);
    useInterval(() => {
        setIndex(index + 1);
    }, 6000);
    return index;
};
export const useErc20Balance = (tokenAddress) => {
    const { address } = useAccount();
    const chainId = useChainId();
    return useReadContract({
        chainId,
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
    });
};
// if token is native ETH, use usBalance instead
export const useTokenBalance = (token) => {
    const { address } = useAccount();
    const chainId = useChainId();
    const index = useChangingIndex();
    const queryClient = useQueryClient();
    const { data: erc20Balance, queryKey: erc20QueryKey } = useErc20Balance(token);
    const { data: balance, queryKey: balanceQueryKey } = useBalance({
        address,
        chainId,
    });
    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: erc20QueryKey });
        queryClient.invalidateQueries({ queryKey: balanceQueryKey });
    }, [index, queryClient, erc20QueryKey, balanceQueryKey]);
    const value = token === ETH_ADDRESS ? balance?.value : erc20Balance;
    return value?.toString() ?? "0";
};
export const useAllowance = (token, spender) => {
    const { address } = useAccount();
    const chainId = useChainId();
    const index = useChangingIndex();
    const queryClient = useQueryClient();
    const { data, queryKey } = useReadContract({
        chainId,
        address: token,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, spender],
    });
    useEffect(() => {
        queryClient.invalidateQueries({ queryKey });
    }, [index, queryClient, queryKey]);
    return data?.toString() ?? "0";
};
export const useApprove = (token, target, amount) => {
    const tokenData = useEnsoToken(token);
    const chainId = useChainId();
    // add one percent so yield tokens can be swapped without needing to approve again
    const amountToApprove = (BigInt(amount ?? 0) * 101n) / 100n;
    return {
        title: `Approve ${formatNumber(normalizeValue(amountToApprove, tokenData?.decimals))} of ${tokenData?.symbol} for spending`,
        args: {
            chainId,
            address: token,
            abi: erc20Abi,
            functionName: "approve",
            args: [target, amountToApprove],
        },
    };
};
export const useExtendedContractWrite = (title, writeContractVariables) => {
    const contractWrite = useWatchWriteTransactionHash(title);
    const write = useCallback(() => {
        if (writeContractVariables.address &&
            writeContractVariables.abi &&
            writeContractVariables.functionName) {
            console.log("writeContractVariables", writeContractVariables);
            // @ts-ignore
            contractWrite.writeContract(writeContractVariables, {
                onError: (error) => {
                    toaster.create({
                        title: error?.shortMessage || error.message,
                        type: "error",
                    });
                    console.error(error);
                },
            });
        }
    }, [contractWrite, writeContractVariables]);
    return {
        ...contractWrite,
        write,
    };
};
const useWatchTransactionHash = (description, usedWriteContract) => {
    // const addRecentTransaction = useAddRecentTransaction();
    const { data: hash, reset } = usedWriteContract;
    // useEffect(() => {
    //   if (hash) addRecentTransaction({ hash, description });
    // }, [hash]);
    const waitForTransaction = useWaitForTransactionReceipt({
        hash,
    });
    // const link = useEtherscanUrl(hash);
    const writeLoading = usedWriteContract.status === "pending";
    // toast error if tx failed to be mined and success if it is having confirmation
    useEffect(() => {
        if (waitForTransaction.error) {
            toaster.create({
                title: waitForTransaction.error.message,
                type: "error",
            });
        }
        else if (waitForTransaction.data) {
            // reset tx hash to eliminate recurring notifications
            reset();
            toaster.create({
                title: description,
                type: "success",
            });
        }
        else if (waitForTransaction.isLoading) {
            toaster.create({
                title: description,
                type: "info",
            });
        }
    }, [
        waitForTransaction.data,
        waitForTransaction.error,
        waitForTransaction.isLoading,
    ]);
    return {
        ...usedWriteContract,
        isLoading: writeLoading || waitForTransaction.isLoading,
        walletLoading: writeLoading,
        txLoading: waitForTransaction.isLoading,
        waitData: waitForTransaction.data,
    };
};
export const useWatchSendTransactionHash = (title) => {
    const sendTransaction = useSendTransaction();
    return useWatchTransactionHash(title, sendTransaction);
};
const useWatchWriteTransactionHash = (description) => {
    const writeContract = useWriteContract();
    return useWatchTransactionHash(description, writeContract);
};
export const useExtendedSendTransaction = (title, txData) => {
    const sendTransaction = useWatchSendTransactionHash(title);
    const send = useCallback(() => {
        if (!txData)
            return;
        sendTransaction.sendTransaction(txData, {
            onError: (error) => {
                toaster.create({
                    // @ts-ignore
                    title: error?.cause?.shortMessage,
                    type: "error",
                });
                console.error(error);
            },
        });
    }, [sendTransaction, txData]);
    return {
        ...sendTransaction,
        send,
    };
};
export const useApproveIfNecessary = (tokenIn, amount, spender) => {
    const allowance = useAllowance(tokenIn, spender);
    const approveData = useApprove(tokenIn, spender, amount);
    const writeApprove = useExtendedContractWrite(approveData.title, approveData.args);
    if (tokenIn === ETH_ADDRESS)
        return undefined;
    return +allowance <= +amount ? writeApprove : undefined;
};
export const useSendEnsoTransaction = (ensoTxData, params) => {
    const tokenData = useEnsoToken(params?.tokenOut);
    const tokenFromData = useEnsoToken(params?.tokenIn);
    const description = params?.tokenIn && params?.tokenOut && params?.amountIn
        ? `Purchase ${formatNumber(normalizeValue(params.amountIn, tokenFromData?.decimals))} ${tokenFromData?.symbol} of ${tokenData?.symbol}`
        : "Interacting with Enso";
    return useExtendedSendTransaction(description, ensoTxData);
};
