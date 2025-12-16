import { WalletBalance, TokenData } from "@ensofinance/sdk";

export type Position = {
  balance: WalletBalance;
  token: TokenData & { project: string };
};
