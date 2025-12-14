import { formatUnits, parseUnits } from "viem";
export const denormalizeValue = (value, decimals = 0) => parseUnits(value, decimals).toString();
export const normalizeValue = (value = "0", decimals = 0) => {
    try {
        return formatUnits(BigInt(value), decimals);
    }
    catch (e) {
        console.error(e);
        return "0";
    }
};
export const compareCaseInsensitive = (a, b) => {
    return !!(a && b && a?.toLowerCase() === b?.toLowerCase());
};
export const shortenAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;
const formatter = Intl.NumberFormat("en", {
    maximumFractionDigits: 4,
});
const preciseFormatter = Intl.NumberFormat("en", {
    maximumFractionDigits: 6,
});
const usdFormatter = Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
});
export const formatNumber = (value, precise) => {
    const formatterToUse = precise ? preciseFormatter : formatter;
    return isNaN(+value) ? "0.0" : formatterToUse.format(+value);
};
export const formatUSD = (value) => {
    return usdFormatter.format(+value);
};
