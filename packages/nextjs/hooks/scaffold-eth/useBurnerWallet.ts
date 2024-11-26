import { useCallback, useEffect, useRef, useState } from "react"; // 导入 React 的钩子函数
import { useLocalStorage } from "usehooks-ts"; // 导入自定义钩子函数，用于本地存储
import { Chain, Hex, HttpTransport, PrivateKeyAccount, createWalletClient, http } from "viem"; // 导入 viem 库中的类型和函数
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"; // 导入生成私钥和私钥转换账户的函数
import { WalletClient, usePublicClient } from "wagmi"; // 导入 wagmi 库中的钱包客户端和公共客户端钩子

const burnerStorageKey = "scaffoldEth2.burnerWallet.sk"; // 定义本地存储键，用于存储 burner 钱包的私钥

/**
 * 检查私钥是否有效
 */
const isValidSk = (pk: Hex | string | undefined | null): boolean => {
  return pk?.length === 64 || pk?.length === 66;
};

/**
 * 如果本地存储中没有找到 burner 钱包，则生成一个随机私钥
 */
const newDefaultPrivateKey = generatePrivateKey();

/**
 * 将当前 burner 私钥保存到本地存储
 */
export const saveBurnerSK = (privateKey: Hex): void => {
  if (typeof window != "undefined" && window != null) {
    window?.localStorage?.setItem(burnerStorageKey, privateKey);
  }
};

/**
 * 从本地存储获取当前的 burner 私钥
 */
export const loadBurnerSK = (): Hex => {
  let currentSk: Hex = "0x";
  if (typeof window != "undefined" && window != null) {
    currentSk = (window?.localStorage?.getItem?.(burnerStorageKey)?.replaceAll('"', "") ?? "0x") as Hex;
  }

  if (!!currentSk && isValidSk(currentSk)) {
    return currentSk;
  } else {
    saveBurnerSK(newDefaultPrivateKey);
    return newDefaultPrivateKey;
  }
};

type BurnerAccount = {
  walletClient: WalletClient | undefined;
  account: PrivateKeyAccount | undefined;
  // 创建一个新的 burner 账户
  generateNewBurner: () => void;
  // 显式保存 burner 到存储
  saveBurner: () => void;
};

/**
 * 创建一个 burner 钱包
 */
export const useBurnerWallet = (): BurnerAccount => {
  const [burnerSk, setBurnerSk] = useLocalStorage<Hex>(burnerStorageKey, newDefaultPrivateKey, {
    initializeWithValue: false,
  });

  const publicClient = usePublicClient(); // 获取公共客户端
  const [walletClient, setWalletClient] = useState<WalletClient<HttpTransport, Chain, PrivateKeyAccount>>(); // 定义钱包客户端状态
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState<Hex>("0x"); // 定义生成的私钥状态
  const [account, setAccount] = useState<PrivateKeyAccount>(); // 定义账户状态
  const isCreatingNewBurnerRef = useRef(false); // 使用 ref 变量跟踪是否正在创建新的 burner 钱包

  const saveBurner = useCallback(() => {
    setBurnerSk(generatedPrivateKey); // 保存当前生成的私钥到本地存储
  }, [setBurnerSk, generatedPrivateKey]);

  const generateNewBurner = useCallback(() => {
    if (publicClient && !isCreatingNewBurnerRef.current) {
      console.log("🔑 Create new burner wallet...");
      isCreatingNewBurnerRef.current = true;

      const randomPrivateKey = generatePrivateKey(); // 生成随机私钥
      const randomAccount = privateKeyToAccount(randomPrivateKey); // 将私钥转换为账户

      const client = createWalletClient({
        chain: publicClient.chain,
        account: randomAccount,
        transport: http(),
      });

      setWalletClient(client);
      setGeneratedPrivateKey(randomPrivateKey);
      setAccount(randomAccount);

      setBurnerSk(() => {
        console.log("🔥 Saving new burner wallet");
        isCreatingNewBurnerRef.current = false;
        return randomPrivateKey;
      });
      return client;
    } else {
      console.log("⚠ Could not create burner wallet");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient.chain.id]);

  /**
   * 使用 burnerSk 加载钱包
   * 一旦我们有了 burnerSk 和有效的 provider，就连接并设置钱包
   */
  useEffect(() => {
    if (burnerSk && publicClient.chain.id) {
      let wallet: WalletClient<HttpTransport, Chain, PrivateKeyAccount> | undefined = undefined;
      if (isValidSk(burnerSk)) {
        const randomAccount = privateKeyToAccount(burnerSk);

        wallet = createWalletClient({
          chain: publicClient.chain,
          account: randomAccount,
          transport: http(),
        });

        setGeneratedPrivateKey(burnerSk);
        setAccount(randomAccount);
      } else {
        wallet = generateNewBurner();
      }

      if (wallet == null) {
        throw "Error:  Could not create burner wallet";
      }

      setWalletClient(wallet);
      saveBurner();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burnerSk, publicClient.chain.id]);

  return {
    walletClient,
    account,
    generateNewBurner,
    saveBurner,
  };
};
