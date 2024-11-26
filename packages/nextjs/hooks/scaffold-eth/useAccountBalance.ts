import { useCallback, useEffect, useState } from "react"; // 导入 React 的钩子函数
import { useTargetNetwork } from "./useTargetNetwork"; // 导入自定义钩子函数，用于获取目标网络
import { Address } from "viem"; // 导入 Address 类型
import { useBalance } from "wagmi"; // 导入 wagmi 库中的 useBalance 钩子，用于获取账户余额
import { useGlobalState } from "~~/services/store/store"; // 导入全局状态管理钩子

export function useAccountBalance(address?: Address) {
  const [isEthBalance, setIsEthBalance] = useState(true); // 定义一个状态变量，用于切换显示余额的单位（ETH 或其他）
  const [balance, setBalance] = useState<number | null>(null); // 定义一个状态变量，用于存储余额
  const price = useGlobalState(state => state.nativeCurrencyPrice); // 从全局状态中获取当前货币的价格
  const { targetNetwork } = useTargetNetwork(); // 获取当前的目标网络

  const {
    data: fetchedBalanceData,
    isError,
    isLoading,
  } = useBalance({
    address, // 账户地址
    watch: true, // 是否持续监控余额变化
    chainId: targetNetwork.id, // 当前网络的链 ID
  });

  // 定义一个回调函数，用于切换显示余额的单位
  const onToggleBalance = useCallback(() => {
    if (price > 0) { // 如果价格大于 0，则切换显示单位
      setIsEthBalance(!isEthBalance);
    }
  }, [isEthBalance, price]); // 依赖 isEthBalance 和 price

  // 使用 useEffect 钩子，当 fetchedBalanceData 或 targetNetwork 发生变化时执行
  useEffect(() => {
    if (fetchedBalanceData?.formatted) { // 如果获取到的余额数据存在且已格式化
      setBalance(Number(fetchedBalanceData.formatted)); // 更新余额状态
    }
  }, [fetchedBalanceData, targetNetwork]); // 依赖 fetchedBalanceData 和 targetNetwork

  // 返回多个状态和方法，供组件使用
  return { balance, price, isError, isLoading, onToggleBalance, isEthBalance };
}
