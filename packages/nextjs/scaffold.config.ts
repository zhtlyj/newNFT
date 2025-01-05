import * as chains from "viem/chains";

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
  walletAutoConnect: boolean;
};

// 添加 Mantle Sepolia 网络配置
const mantleSepoliaConfig = {
  id: 5003,
  name: "Mantle Sepolia Testnet",
  network: "mantle-sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "MNT",
    symbol: "MNT",
  },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
    public: { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "Mantle Sepolia Explorer",
      url: "https://sepolia.mantlescan.xyz",
    },
  },
  testnet: true,
} as const;

const scaffoldConfig = {
  // 使用新的 Mantle Sepolia 配置
  targetNetworks: [chains.hardhat,mantleSepoliaConfig, chains.sepolia],

  // 其他配置保持不变
  pollingInterval: 30000,
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF",
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",
  onlyLocalBurnerWallet: true,
  walletAutoConnect: true,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
