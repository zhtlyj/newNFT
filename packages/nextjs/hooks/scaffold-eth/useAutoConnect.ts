import { useEffectOnce, useLocalStorage, useReadLocalStorage } from "usehooks-ts"; // 导入自定义钩子函数
import { Chain, hardhat } from "viem/chains"; // 导入 viem 库中的 Chain 类型和 hardhat 网络配置
import { Connector, useAccount, useConnect } from "wagmi"; // 导入 wagmi 库中的连接器和账户管理钩子函数
import scaffoldConfig from "~~/scaffold.config"; // 导入应用程序的配置
import { burnerWalletId } from "~~/services/web3/wagmi-burner/BurnerConnector"; // 导入 burner 钱包 ID
import { getTargetNetworks } from "~~/utils/scaffold-eth"; // 导入目标网络获取函数

const SCAFFOLD_WALLET_STORAGE_KEY = "scaffoldEth2.wallet"; // 定义存储钱包 ID 的本地存储键
const WAGMI_WALLET_STORAGE_KEY = "wagmi.wallet"; // 定义存储 wagmi 钱包 ID 的本地存储键

// SAFE 连接器实例的 ID
const SAFE_ID = "safe";

/**
 * 获取初始钱包连接器（如果有）
 * @param initialNetwork 初始网络
 * @param previousWalletId 上一个钱包 ID
 * @param connectors 连接器列表
 * @returns 包含连接器和链 ID 的对象
 */
const getInitialConnector = (
  initialNetwork: Chain,
  previousWalletId: string,
  connectors: Connector[],
): { connector: Connector | undefined; chainId?: number } | undefined => {
  // 查找 SAFE 连接器实例，如果在 SAFE 框架中加载则立即连接
  const safeConnectorInstance = connectors.find(connector => connector.id === SAFE_ID && connector.ready);

  if (safeConnectorInstance) {
    return { connector: safeConnectorInstance };
  }

  const allowBurner = scaffoldConfig.onlyLocalBurnerWallet ? initialNetwork.id === hardhat.id : true;

  if (!previousWalletId) {
    // 用户没有连接到钱包
    if (allowBurner && scaffoldConfig.walletAutoConnect) {
      const connector = connectors.find(f => f.id === burnerWalletId);
      return { connector, chainId: initialNetwork.id };
    }
  } else {
    // 用户已经连接到钱包
    if (scaffoldConfig.walletAutoConnect) {
      if (previousWalletId === burnerWalletId && !allowBurner) {
        return;
      }

      const connector = connectors.find(f => f.id === previousWalletId);
      return { connector };
    }
  }

  return undefined;
};

/**
 * 根据配置和先前的钱包自动连接到钱包/连接器
 */
export const useAutoConnect = (): void => {
  const wagmiWalletValue = useReadLocalStorage<string>(WAGMI_WALLET_STORAGE_KEY); // 读取本地存储中的 wagmi 钱包 ID
  const [walletId, setWalletId] = useLocalStorage<string>(SCAFFOLD_WALLET_STORAGE_KEY, wagmiWalletValue ?? "", {
    initializeWithValue: false,
  });
  const connectState = useConnect(); // 获取连接状态
  useAccount({
    onConnect({ connector }) {
      setWalletId(connector?.id ?? ""); // 设置连接成功后的钱包 ID
    },
    onDisconnect() {
      window.localStorage.setItem(WAGMI_WALLET_STORAGE_KEY, JSON.stringify("")); // 清除本地存储中的 wagmi 钱包 ID
      setWalletId(""); // 清空当前钱包 ID
    },
  });

  useEffectOnce(() => {
    const initialConnector = getInitialConnector(getTargetNetworks()[0], walletId, connectState.connectors); // 获取初始连接器

    if (initialConnector?.connector) {
      connectState.connect({ connector: initialConnector.connector, chainId: initialConnector.chainId }); // 自动连接到初始连接器
    }
  });
};
